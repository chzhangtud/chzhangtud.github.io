"""Train the article's small Gaussian VAE and export browser-readable weights.

Requires Python, NumPy and PyTorch. Run from the repository root:
    python assets/examples/vae_toy.py
No external dataset, GPU, checkpoint download or browser framework is required.
"""
import argparse
import json
import math
from pathlib import Path

import torch
from torch import nn


class ToyVAE(nn.Module):
    def __init__(self):
        super().__init__()
        self.encoder = nn.Sequential(nn.Linear(2, 16), nn.Tanh(),
                                     nn.Linear(16, 16), nn.Tanh(), nn.Linear(16, 2))
        self.decoder = nn.Sequential(nn.Linear(1, 16), nn.Tanh(),
                                     nn.Linear(16, 16), nn.Tanh(), nn.Linear(16, 2))

    def encode(self, x):
        mu, logvar = self.encoder(x).chunk(2, dim=-1)
        return mu, logvar.clamp(-8, 5)

    def forward(self, x):
        mu, logvar = self.encode(x)
        z = mu + (0.5 * logvar).exp() * torch.randn_like(mu)
        return self.decoder(z), mu, logvar


def terms(x, mean, mu, logvar, tau):
    # Sum observed coordinates / latent dimensions, then average observations.
    nll = ((x - mean).square() / (2 * tau**2)
           + math.log(tau) + 0.5 * math.log(2 * math.pi)).sum(-1)
    kl = 0.5 * (mu.square() + logvar.exp() - 1 - logvar).sum(-1)
    return nll, kl


def make_data(n, generator, tau):
    latent = torch.randn(n, 1, generator=generator)
    clean = torch.cat((latent, 0.5 * (latent.square() - 1)), dim=1)
    return clean + tau * torch.randn(n, 2, generator=generator)


def export_layers(network):
    layers = []
    for index, layer in enumerate(network):
        if isinstance(layer, nn.Linear):
            layers.append({"weight": layer.weight.detach().tolist(),
                           "bias": layer.bias.detach().tolist(),
                           "activation": "tanh" if index < len(network) - 1 else "linear"})
    return layers


def train(steps=2500):
    torch.set_num_threads(1)
    torch.manual_seed(13)
    tau = 0.18
    data = make_data(512, torch.Generator().manual_seed(21), tau)
    heldout = make_data(256, torch.Generator().manual_seed(22), tau)
    # Fixed independent evaluation draws make checkpoints comparable.
    evaluation_noise = torch.randn(32, 256, 1, generator=torch.Generator().manual_seed(23))
    model = ToyVAE()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.003)
    history = []

    def evaluate(step):
        with torch.no_grad():
            mu, logvar = model.encode(heldout)
            z = mu + (0.5 * logvar).exp() * evaluation_noise
            nll, kl = terms(heldout, model.decoder(z), mu, logvar, tau)
            history.append({"step": step, "nll": nll.mean().item(),
                            "kl": kl.mean().item(), "negativeElbo": (nll + kl).mean().item()})

    evaluate(0)
    for step in range(1, steps + 1):
        batch = data[torch.randint(len(data), (128,))]
        mean, mu, logvar = model(batch)
        nll, kl = terms(batch, mean, mu, logvar, tau)
        loss = (nll + kl).mean()
        if not torch.isfinite(loss):
            raise RuntimeError("Non-finite training loss")
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
        if step % 100 == 0 or step == steps:
            evaluate(step)

    with torch.no_grad():
        check = heldout[:8]
        mu, logvar = model.encode(check)
        expected = model.decoder(mu)
    return {
        "version": 1, "seed": 13, "torchVersion": torch.__version__,
        "training": {"steps": steps, "observations": 512, "batchSize": 128,
                     "learningRate": 0.003, "evaluationObservations": 256,
                     "evaluationSamples": 32, "dataSeed": 21, "heldoutSeed": 22},
        "tau": tau, "logvarBounds": [-8, 5],
        "encoder": export_layers(model.encoder), "decoder": export_layers(model.decoder),
        "observations": heldout[:80].tolist(), "history": history,
        "reference": {"inputs": check.tolist(), "mu": mu.tolist(),
                      "logvar": logvar.tolist(), "decodedMean": expected.tolist()},
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--steps", type=int, default=2500)
    parser.add_argument("--output", type=Path,
                        default=Path(__file__).resolve().parents[1] / "data" / "vae-toy-model.json")
    args = parser.parse_args()
    if args.steps < 1:
        parser.error("--steps must be positive")
    result = train(args.steps)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, ensure_ascii=False, allow_nan=False,
                                      separators=(",", ":")), encoding="utf-8")
    print(json.dumps({"output": str(args.output), "initial": result["history"][0],
                      "final": result["history"][-1]}, ensure_ascii=False))
