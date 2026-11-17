"""Small MNIST DDPM / independent-endpoint flow-matching teaching program.

Requires torch, torchvision, Pillow. Binarizes pixels at >127 and maps to
[-1,1], matching the article widget. Regression losses are not likelihoods.
This is not a pretrained model or a reproduction of paper benchmarks.

python generative_mnist.py --model ddpm --epochs 10
python generative_mnist.py --model fm --epochs 10
python generative_mnist.py --smoke  # synthetic check; no data download
"""
import argparse
import json
import math
from pathlib import Path

import torch
from torch import nn
from torch.nn import functional as F


class TinyField(nn.Module):
    def __init__(self):
        super().__init__()
        self.register_buffer("frequencies", torch.exp(torch.linspace(0, math.log(1000), 16)))
        self.time = nn.Sequential(nn.Linear(32, 64), nn.SiLU(), nn.Linear(64, 96))
        self.first = nn.Conv2d(1, 32, 3, padding=1)
        self.down = nn.Conv2d(32, 64, 3, stride=2, padding=1)
        self.middle = nn.Sequential(nn.GroupNorm(8, 64), nn.SiLU(), nn.Conv2d(64, 64, 3, padding=1))
        self.last = nn.Sequential(nn.Conv2d(96, 32, 3, padding=1), nn.SiLU(), nn.Conv2d(32, 1, 3, padding=1))

    def forward(self, x, time):
        phase = time[:, None] * self.frequencies[None, :]
        small, large = self.time(torch.cat((phase.sin(), phase.cos()), dim=1)).split((32, 64), dim=1)
        skip = F.silu(self.first(x) + small[:, :, None, None])
        hidden = self.middle(self.down(skip) + large[:, :, None, None])
        return self.last(torch.cat((skip, F.interpolate(hidden, size=x.shape[-2:], mode="nearest")), dim=1))


def schedule(steps, device):
    beta = torch.linspace(0.0001, 0.04, steps, device=device)
    alpha = 1 - beta
    return beta, alpha, alpha.cumprod(0)


def regression_loss(model, clean, kind, alpha_bar, generator=None):
    batch = len(clean)
    noise = torch.randn(clean.shape, device=clean.device, generator=generator)
    if kind == "ddpm":
        index = torch.randint(len(alpha_bar), (batch,), device=clean.device, generator=generator)
        a = alpha_bar[index, None, None, None]
        current = a.sqrt() * clean + (1 - a).sqrt() * noise
        time = (index.float() + 1) / len(alpha_bar)
        target = noise
    else:
        time = torch.rand(batch, device=clean.device, generator=generator)
        t = time[:, None, None, None]
        current, target = (1 - t) * noise + t * clean, clean - noise
    return (model(current, time) - target).square().flatten(1).mean(1)


@torch.no_grad()
def sample(model, kind, diffusion_steps=500, flow_steps=100, count=64, seed=83):
    model.eval()
    device = next(model.parameters()).device
    generator = torch.Generator(device=device).manual_seed(seed)
    x = torch.randn((count, 1, 28, 28), device=device, generator=generator)
    if kind == "ddpm":
        beta, alpha, alpha_bar = schedule(diffusion_steps, device)
        for index in range(diffusion_steps - 1, -1, -1):
            time = torch.full((count,), (index + 1) / diffusion_steps, device=device)
            mean = (x - beta[index] * model(x, time) / (1 - alpha_bar[index]).sqrt()) / alpha[index].sqrt()
            if index:
                variance = beta[index] * (1 - alpha_bar[index - 1]) / (1 - alpha_bar[index])
                x = mean + variance.sqrt() * torch.randn(x.shape, device=device, generator=generator)
            else:
                x = mean
    else:
        h = 1 / flow_steps
        for index in range(flow_steps):
            time = torch.full((count,), index * h, device=device)
            first = model(x, time)
            second = model(x + h * first, time + h)
            x = x + h * (first + second) / 2
    return x  # Clip only when saving the display, not inside these updates.


def smoke():
    torch.manual_seed(47)
    torch.set_num_threads(2)
    clean = torch.rand(4, 1, 28, 28) * 2 - 1
    for kind in ("ddpm", "fm"):
        model = TinyField()
        optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
        before = model.first.weight.detach().clone()
        loss = regression_loss(model, clean, kind, schedule(16, "cpu")[2]).mean()
        optimizer.zero_grad()
        loss.backward()
        assert torch.isfinite(loss)
        assert all(p.grad is None or torch.isfinite(p.grad).all() for p in model.parameters())
        optimizer.step()
        assert not torch.equal(before, model.first.weight)
        generated = sample(model, kind, diffusion_steps=16, flow_steps=4, count=4)
        assert generated.shape == clean.shape and torch.isfinite(generated).all()
        print(f"{kind}: finite loss, gradients, parameter update, and samples; synthetic smoke check only")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", choices=("ddpm", "fm"), default="ddpm")
    parser.add_argument("--data-dir", type=Path, default=Path("mnist-data"))
    parser.add_argument("--output", type=Path, default=Path("generative-run"))
    parser.add_argument("--epochs", type=int, default=10)
    parser.add_argument("--batch-size", type=int, default=128)
    parser.add_argument("--steps", type=int, default=500)
    parser.add_argument("--flow-steps", type=int, default=100)
    parser.add_argument("--device", default="cuda" if torch.cuda.is_available() else "cpu")
    parser.add_argument("--smoke", action="store_true")
    args = parser.parse_args()
    if args.smoke:
        smoke()
        return
    if min(args.epochs, args.batch_size, args.flow_steps) < 1 or args.steps < 2:
        parser.error("positive epochs/batch/flow steps and at least two DDPM steps are required")
    from torchvision.datasets import MNIST
    from torchvision.utils import save_image
    torch.manual_seed(47)
    torch.set_num_threads(2)
    device = torch.device(args.device)
    dataset = MNIST(args.data_dir, train=True, download=True)
    # The official test set is not loaded for fitting or checkpoint selection.
    values = (dataset.data[:, None] > 127).float() * 2 - 1
    permutation = torch.randperm(len(values), generator=torch.Generator().manual_seed(33))
    training, validation = values[permutation[:55000]], values[permutation[55000:]]
    loader = torch.utils.data.DataLoader(training, batch_size=args.batch_size, shuffle=True,
                                         generator=torch.Generator().manual_seed(48))
    model = TinyField().to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
    alpha_bar = schedule(args.steps, device)[2]
    args.output.mkdir(parents=True, exist_ok=True)
    history, best = [], float("inf")
    for epoch in range(args.epochs):
        model.train()
        train_sum = 0.0
        for clean in loader:
            losses = regression_loss(model, clean.to(device), args.model, alpha_bar)
            optimizer.zero_grad()
            losses.mean().backward()
            optimizer.step()
            train_sum += losses.detach().sum().item()
        model.eval()
        validation_sum = 0.0
        fixed = torch.Generator(device=device).manual_seed(59)
        with torch.no_grad():
            for clean in validation.split(args.batch_size):
                validation_sum += regression_loss(model, clean.to(device), args.model, alpha_bar, fixed).sum().item()
        entry = {"epoch": epoch + 1, "trainRegression": train_sum / len(training),
                 "validationRegression": validation_sum / len(validation)}
        history.append(entry)
        print(json.dumps(entry), flush=True)
        if entry["validationRegression"] < best:
            best = entry["validationRegression"]
            torch.save(model.state_dict(), args.output / f"{args.model}-best.pt")
    model.load_state_dict(torch.load(args.output / f"{args.model}-best.pt", map_location=device, weights_only=True))
    generated = sample(model, args.model, args.steps, args.flow_steps)
    save_image((generated.clamp(-1, 1) + 1) / 2, args.output / f"{args.model}-samples.png", nrow=8)
    metadata = {"model": args.model, "seed": 47, "splitSeed": 33, "sampleSeed": 83,
                "trainCount": 55000, "validationCount": 5000, "officialTestUsed": False,
                "preprocessing": "pixel >127, then map {0,1} to {-1,1}",
                "torchVersion": torch.__version__, "history": history,
                "diffusionSteps": args.steps, "terminalAlphaBar": float(alpha_bar[-1]),
                "flowSteps": args.flow_steps, "flowNFE": args.flow_steps * 2,
                "note": "Teaching regression losses; no likelihood or benchmark-quality claim."}
    (args.output / f"{args.model}-run.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
