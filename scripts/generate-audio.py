"""Gera a trilha e o descanso do jogo, sem gravações ou bibliotecas externas."""
from array import array
from pathlib import Path
import math
import random
import wave

RATE = 22050
TAU = math.tau
random.seed(42)
OUT = Path(__file__).resolve().parents[1] / "public" / "audio"
OUT.mkdir(exist_ok=True)


def buffers(seconds):
    count = round(seconds * RATE)
    return array("f", [0]) * count, array("f", [0]) * count


def note(left, right, start, seconds, midi, gain, pan=0, voice="keys"):
    frequency = 440 * 2 ** ((midi - 69) / 12)
    first = round(start * RATE)
    lg, rg = math.sqrt((1 - pan) / 2), math.sqrt((1 + pan) / 2)
    count = len(left)
    for index in range(round(seconds * RATE)):
        t = index / RATE
        phase = TAU * frequency * t
        attack = min(1, t / (0.35 if voice == "pad" else 0.012))
        release = min(1, (seconds - t) / 0.15)
        if voice == "pad":
            tone = math.sin(phase) + 0.16 * math.sin(phase * 1.002)
            envelope = attack * min(1, (seconds - t) / 0.65) * 0.65
        elif voice == "guitar":
            tone = sum(math.sin(phase * harmonic) * math.exp(-t * (1.5 + harmonic * .65)) / harmonic for harmonic in range(1, 7))
            envelope = attack * release
        elif voice == "bass":
            tone = math.sin(phase) + 0.13 * math.sin(phase * 2)
            envelope = attack * release * math.exp(-t * 1.7)
        else:
            tone = (math.sin(phase) + 0.25 * math.sin(phase * 2.001) * math.exp(-t * 3)
                    + 0.09 * math.sin(phase * 3.005) * math.exp(-t * 5))
            envelope = attack * release * math.exp(-t * 1.8)
        value = gain * envelope * tone
        target = (first + index) % count
        left[target] += value * lg
        right[target] += value * rg


def drum(left, right, start, kind):
    length = 0.22 if kind == "kick" else 0.11
    first = round(start * RATE)
    previous = 0
    for index in range(round(length * RATE)):
        t = index / RATE
        noise = random.uniform(-1, 1)
        previous = previous * 0.72 + noise * 0.28
        if kind == "kick":
            value = 0.095 * math.sin(TAU * (48 * t + 1.4 * (1 - math.exp(-t * 28)))) * math.exp(-t * 22)
        elif kind == "brush":
            value = 0.045 * previous * math.exp(-t * 35)
        else:
            value = 0.009 * (noise - previous) * math.exp(-t * 70)
        value *= min(1, t / 0.003)
        target = (first + index) % len(left)
        left[target] += value * 0.7
        right[target] += value * 0.7


def save(name, left, right, echo=True):
    if echo:
        dry_l, dry_r = left[:], right[:]
        delays = [(round(RATE * 0.19), 0.16), (round(RATE * 0.37), 0.08)]
        for index in range(len(left)):
            for delay, gain in delays:
                left[index] += dry_r[(index - delay) % len(left)] * gain
                right[index] += dry_l[(index - delay) % len(left)] * gain
    peak = max(max(map(abs, left)), max(map(abs, right)), 0.01)
    scale = min(2.5, 0.68 / peak)
    pcm = array("h")
    for a, b in zip(left, right):
        pcm.extend((round(math.tanh(a * scale) * 28000), round(math.tanh(b * scale) * 28000)))
    import sys
    if sys.byteorder != "little":
        pcm.byteswap()
    with wave.open(str(OUT / name), "wb") as target:
        target.setnchannels(2)
        target.setsampwidth(2)
        target.setframerate(RATE)
        target.writeframes(pcm.tobytes())
    print(f"{name}: {len(left) / RATE:.1f}s, estéreo")


def soundtrack():
    beat = 60 / 88
    left, right = buffers(16 * 4 * beat)
    chords = [(48, [60, 64, 67, 71]), (45, [60, 64, 67, 69]),
              (41, [57, 60, 64, 65]), (43, [59, 62, 67, 69])]
    melodies = [[76, 74, 71, 67], [72, 71, 69, 64],
                [69, 72, 76, 72], [74, 71, 69, 67]]
    for bar in range(16):
        chord_index = (bar // 2) % 4
        bass, chord = chords[chord_index]
        start = bar * 4 * beat
        for index, pitch in enumerate(chord):
            note(left, right, start + index * 0.018, 2.8, pitch, 0.072, -0.35)
            if bar % 2 == 0:
                note(left, right, start, 8 * beat, pitch, 0.009, 0.2, "pad")
        note(left, right, start, 1.3, bass, 0.13, voice="bass")
        note(left, right, start + 2.5 * beat, 1.0, bass + 7, 0.085, voice="bass")
        for step, pitch in enumerate(melodies[chord_index]):
            # Alterna a frase para o loop não repetir cada compasso do mesmo jeito.
            if bar % 2 == 1 and step == 2:
                continue
            note(left, right, start + (step + 0.18) * beat, 1.8,
                 pitch + (12 if bar >= 8 and step == 3 else 0), 0.064, 0.32)
        for step in range(8):
            drum(left, right, start + step * beat / 2 + (0.025 if step % 2 else 0), "hat")
        for step in [0, 2.5]:
            drum(left, right, start + step * beat, "kick")
        for step in [1, 3]:
            drum(left, right, start + (step + 0.04) * beat, "brush")
    save("devcity-fim-de-tarde.wav", left, right)


def sleep_sound():
    left, right = buffers(8)
    smooth = 0
    for index in range(len(left)):
        t = index / RATE
        noise = random.uniform(-1, 1)
        smooth = 0.94 * smooth + 0.06 * noise
        sheets = 0.15 * smooth * max(0, 1 - t / 0.65) * min(1, t / 0.025)
        breathing = max(0, math.sin(TAU * (t - 0.8) / 3.4)) ** 2
        snore = 0.022 * math.sin(TAU * 105 * t + 0.9 * math.sin(TAU * 3 * t))
        value = sheets + breathing * (smooth * 0.11 + snore)
        value *= min(1, (8 - t) / 0.25)
        left[index] = value
        right[index] = value
    for index, pitch in enumerate([76, 72, 67]):
        note(left, right, 0.12 + index * 0.22, 1.5, pitch, 0.04)
    save("descanso.wav", left, right, echo=False)


if __name__ == "__main__":
    soundtrack()
    sleep_sound()
