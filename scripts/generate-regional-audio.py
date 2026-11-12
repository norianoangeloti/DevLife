"""Ambientes e composições originais dos mapas, sem samples externos."""
import importlib.util
import math
import random
from pathlib import Path

spec = importlib.util.spec_from_file_location('synth', Path(__file__).with_name('generate-audio.py'))
synth = importlib.util.module_from_spec(spec)
spec.loader.exec_module(synth)
random.seed(2026)

def nature():
    left, right = synth.buffers(32)
    wind = water = 0
    for i in range(len(left)):
        t = i / synth.RATE
        noise = random.uniform(-1, 1)
        wind = .995 * wind + .005 * noise
        water = .64 * water + .36 * noise
        fade = min(1, t / .3, (32 - t) / .3)
        breeze = wind * .65 * (.7 + .3 * math.sin(synth.TAU * t / 16))
        stream = water * .027 + .004 * math.sin(synth.TAU * 430 * t + 3 * math.sin(t * 17))
        left[i] = (breeze + stream) * fade
        right[i] = (breeze * .8 + stream * .9) * fade
    for n in range(26):
        start = .7 + n * 1.16 + random.uniform(0, .35)
        pan = random.uniform(-.8, .8)
        for chirp in range(2 + n % 3):
            first = round((start + chirp * .13) * synth.RATE)
            pitch = random.uniform(1900, 3300)
            for j in range(round(.095 * synth.RATE)):
                t = j / synth.RATE
                value = .045 * math.sin(math.pi * t / .095) ** 2 * math.sin(synth.TAU * (pitch * t + 2200 * t * t))
                k = (first + j) % len(left)
                left[k] += value * (1-pan) / 2
                right[k] += value * (1+pan) / 2
    synth.save('praca-natureza.wav', left, right, echo=False)

def urban():
    beat = 60 / 96
    left, right = synth.buffers(16 * 4 * beat)
    for bar in range(16):
        start = bar * 4 * beat
        root, chord = [(45,[57,60,64,67]),(41,[57,60,64,69]),(48,[55,59,62,64]),(43,[55,59,62,65])][bar % 4]
        for step in [0, 1.75, 2.5]:
            synth.note(left,right,start+step*beat,.55,root+(7 if step==2.5 else 0),.16,voice='bass')
            synth.drum(left,right,start+step*beat,'kick')
        for step in [1,3]:
            synth.drum(left,right,start+step*beat,'brush')
            for pitch in chord:
                synth.note(left,right,start+(step+.08)*beat,.7,pitch,.045,-.25)
        for step in range(8):
            synth.drum(left,right,start+(step/2+(.06 if step%2 else 0))*beat,'hat')
        if bar%2:
            for step,pitch in enumerate([76,74,72,67]):
                synth.note(left,right,start+(step*.5+.15)*beat,.55,pitch,.035,.45)
    synth.save('centro-urbano.wav',left,right)

def americana():
    beat = 60 / 108
    left, right = synth.buffers(16 * 4 * beat)
    progression=[(43,[55,59,62]),(48,[55,60,64]),(43,[55,59,62]),(50,[57,62,66])]
    phrases=[[67,69,71,74,71,69],[72,76,74,72,69,67],[67,71,74,79,74,71],[69,74,78,76,74,69]]
    for bar in range(16):
        start=bar*4*beat
        root,chord=progression[bar%4]
        for step in range(4):
            synth.note(left,right,start+step*beat,.45,root+(7 if step%2 else 0),.12,voice='bass')
            for index,pitch in enumerate(chord):
                synth.note(left,right,start+(step+.45)*beat+index*.014,.65,pitch,.065,-.4,'guitar')
            synth.drum(left,right,start+step*beat,'hat')
        for step in [0,2]:synth.drum(left,right,start+step*beat,'kick')
        for step in [1,3]:synth.drum(left,right,start+step*beat,'brush')
        for step,pitch in enumerate(phrases[bar%4]):
            synth.note(left,right,start+(step*.5+.12)*beat,.8,pitch,.065,.4,'guitar')
    synth.save('usa-estrada.wav',left,right)

if __name__=='__main__':
    nature()
    urban()
    americana()
