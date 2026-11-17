"""Reproduce the article's binary-MNIST VAE and export it for the browser.

Requires torch and torchvision. Downloads the official MNIST train/test splits.
    python assets/examples/vae_mnist.py --data-dir D:/MyMaterials/mnist --epochs 16
The digit labels are never passed to the training objective.
"""
import argparse
import json
from pathlib import Path

import torch
from torch import nn
from torch.nn import functional as F
from torchvision.datasets import MNIST


class MNISTVAE(nn.Module):
    def __init__(self):
        super().__init__()
        self.encoder = nn.Sequential(nn.Linear(784, 128), nn.Tanh(),
                                     nn.Linear(128, 64), nn.Tanh(), nn.Linear(64, 4))
        self.decoder = nn.Sequential(nn.Linear(2, 64), nn.Tanh(),
                                     nn.Linear(64, 128), nn.Tanh(), nn.Linear(128, 784))

    def encode(self, x):
        mu, logvar = self.encoder(x).chunk(2, -1)
        return mu, logvar.clamp(-8, 5)


def loss_terms(logits, x, mu, logvar):
    nll = F.binary_cross_entropy_with_logits(logits, x, reduction="none").sum(-1)
    kl = 0.5 * (mu.square() + logvar.exp() - 1 - logvar).sum(-1)
    return nll, kl


def export_layers(network):
    result = []
    for index, layer in enumerate(network):
        if isinstance(layer, nn.Linear):
            result.append({"weight": [[round(v, 7) for v in row]
                                      for row in layer.weight.detach().tolist()],
                           "bias": [round(v, 7) for v in layer.bias.detach().tolist()],
                           "activation": "tanh" if index < len(network) - 1 else "linear"})
    return result


def train(data_dir, epochs=16):
    torch.set_num_threads(2)
    torch.manual_seed(31)
    train_set = MNIST(data_dir, train=True, download=True)
    test_set = MNIST(data_dir, train=False, download=True)
    # Fixed threshold creates actual Bernoulli-valued observations.
    all_training = (train_set.data.flatten(1) > 127).float()
    split = torch.randperm(60000, generator=torch.Generator().manual_seed(33))
    train_x = all_training[split[:55000]]
    validation_x = all_training[split[55000:]]
    test_x = (test_set.data.flatten(1) > 127).float()
    model = MNISTVAE()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
    history = []
    evaluation_noise = torch.randn(len(validation_x), 2, generator=torch.Generator().manual_seed(32))

    def evaluate(data, noise):
        totals = torch.zeros(2)
        with torch.no_grad():
            for start in range(0, len(data), 512):
                x = data[start:start + 512]
                mu, logvar = model.encode(x)
                z = mu + (logvar / 2).exp() * noise[start:start + len(x)]
                nll, kl = loss_terms(model.decoder(z), x, mu, logvar)
                totals += torch.stack((nll.sum(), kl.sum()))
        nll, kl = (totals / len(data)).tolist()
        return {"nll": nll, "kl": kl, "negativeElbo": nll + kl}

    def record(epoch):
        row = {"epoch": epoch, **evaluate(validation_x, evaluation_noise)}
        history.append(row)
        print(json.dumps(row), flush=True)

    record(0)
    for epoch in range(1, epochs + 1):
        permutation = torch.randperm(len(train_x))
        for indices in permutation.split(256):
            x = train_x[indices]
            mu, logvar = model.encode(x)
            z = mu + (logvar / 2).exp() * torch.randn_like(mu)
            nll, kl = loss_terms(model.decoder(z), x, mu, logvar)
            loss = (nll + kl).mean()
            if not torch.isfinite(loss):
                raise RuntimeError("Non-finite MNIST training objective")
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
        record(epoch)

    test_noise = torch.randn(len(test_x), 2, generator=torch.Generator().manual_seed(34))
    test_metrics = evaluate(test_x, test_noise)

    with torch.no_grad():
        mu, logvar = model.encode(test_x[:40])
        probabilities = model.decoder(mu[:3]).sigmoid()
    return {"version": 1, "seed": 31, "torchVersion": torch.__version__,
            "training": {"epochs": epochs, "trainCount": 55000, "validationCount": 5000, "testCount": 10000,
                         "batchSize": 256, "learningRate": 0.001,
                         "threshold": 127, "latentDimensions": 2, "klWeight": 1,
                         "evaluationSamples": 1, "evaluationSeed": 32, "splitSeed": 33, "testSeed": 34},
            "logvarBounds": [-8, 5], "encoder": export_layers(model.encoder),
            "decoder": export_layers(model.decoder), "history": history, "testMetrics": test_metrics,
            "images": ["".join(str(int(v)) for v in row) for row in test_x[:40].tolist()],
            "labels": test_set.targets[:40].tolist(),
            "reference": {"mu": mu[:3].tolist(), "logvar": logvar[:3].tolist(),
                          "probabilities": probabilities.tolist()}}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-dir", type=Path, default=Path.home() / ".cache" / "vae-article-mnist")
    parser.add_argument("--epochs", type=int, default=16)
    parser.add_argument("--output", type=Path,
                        default=Path(__file__).resolve().parents[1] / "data" / "vae-mnist-model.json")
    args = parser.parse_args()
    if args.epochs < 1:
        parser.error("--epochs must be positive")
    result = train(args.data_dir, args.epochs)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, separators=(",", ":"), allow_nan=False), encoding="utf-8")
    print(f"Exported {args.output}", flush=True)
