// ============================================================
// Synthwave Audio Engine — Lookahead Scheduler + Disc SFX
// ============================================================

export class SynthwaveAudio {
    constructor() {
        this.ctx = null;
        this.started = false;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.reverb = null;

        // Sequencer state
        this.bpm = 110;
        this.beatLen = 60 / this.bpm;
        this.nextBeatTime = 0;
        this.currentBeat = 0;
        this.schedulerTimer = null;
        this.playing = false;

        // Lookahead config
        this.scheduleAhead = 0.15;
        this.timerInterval = 50;

        // Tweakable synth parameters
        this.reverbAmount = 0.25;   // 0–1
        this.delayAmount = 0.25;    // 0–1 (feedback)
        this.bassWave = 'sawtooth'; // sine | square | sawtooth | triangle
        this.padWave = 'sawtooth';
        this.arpWave = 'square';
        this.bassFilterCutoff = 500;   // Hz (100–2000)
        this.padFilterCutoff = 1000;   // Hz (200–4000)
    }

    init() {
        if (this.started) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio not supported');
            return;
        }
        this.started = true;

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.35;
        this.masterGain.connect(this.ctx.destination);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.7;
        this.musicGain.connect(this.masterGain);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 1.0;
        this.sfxGain.connect(this.masterGain);

        this.reverb = this._createReverb();
        this.reverbSend = this.ctx.createGain();
        this.reverbSend.gain.value = 0.25;
        this.reverb.connect(this.reverbSend);
        this.reverbSend.connect(this.musicGain);

        this.delay = this.ctx.createDelay(1.0);
        this.delay.delayTime.value = this.beatLen * 0.75;
        this.delayFeedback = this.ctx.createGain();
        this.delayFeedback.gain.value = 0.25;
        this.delay.connect(this.delayFeedback);
        this.delayFeedback.connect(this.delay);
        this.delay.connect(this.musicGain);

        this.startMusic();
    }

    _createReverb() {
        const len = this.ctx.sampleRate * 2;
        const impulse = this.ctx.createBuffer(2, len, this.ctx.sampleRate);
        for (let ch = 0; ch < 2; ch++) {
            const d = impulse.getChannelData(ch);
            for (let i = 0; i < len; i++) {
                d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
            }
        }
        const conv = this.ctx.createConvolver();
        conv.buffer = impulse;
        return conv;
    }

    startMusic() {
        if (this.playing) return;
        this.playing = true;
        this.nextBeatTime = this.ctx.currentTime + 0.1;
        this.currentBeat = 0;
        this._scheduleLoop();
    }

    stopMusic() {
        this.playing = false;
        if (this.schedulerTimer) {
            clearInterval(this.schedulerTimer);
            this.schedulerTimer = null;
        }
    }

    pause() {
        if (this.ctx && this.ctx.state === 'running') {
            this.ctx.suspend();
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // --- Volume controls ---

    setMasterVolume(value) {
        // value: 0..100
        if (!this.masterGain) return;
        this.masterGain.gain.value = value / 100;
    }

    setMusicVolume(value) {
        // value: 0..100
        if (!this.musicGain) return;
        this.musicGain.gain.value = value / 100;
    }

    setSFXVolume(value) {
        // value: 0..100
        if (!this.sfxGain) return;
        this.sfxGain.gain.value = value / 100;
    }

    setBPM(bpm) {
        this.bpm = Math.max(60, Math.min(200, bpm));
        this.beatLen = 60 / this.bpm;
        if (this.delay) {
            this.delay.delayTime.value = this.beatLen * 0.75;
        }
    }

    setReverbAmount(value) {
        // value: 0–100
        this.reverbAmount = value / 100;
        if (this.reverbSend) this.reverbSend.gain.value = this.reverbAmount;
    }

    setDelayAmount(value) {
        // value: 0–100
        this.delayAmount = value / 100;
        if (this.delayFeedback) this.delayFeedback.gain.value = this.delayAmount;
    }

    _scheduleLoop() {
        this.schedulerTimer = setInterval(() => {
            if (!this.playing) return;
            while (this.nextBeatTime < this.ctx.currentTime + this.scheduleAhead) {
                this._scheduleBeat(this.currentBeat, this.nextBeatTime);
                this.nextBeatTime += this.beatLen / 2;
                this.currentBeat++;
            }
        }, this.timerInterval);
    }

    _scheduleBeat(beat, time) {
        const barBeat = beat % 16;
        const halfBeat = beat % 2 === 0;

        if (barBeat === 0 || barBeat === 4 || barBeat === 8 || barBeat === 12) {
            this._kick(time);
        }
        if (barBeat === 2 || barBeat === 6 || barBeat === 10 || barBeat === 14) {
            this._snare(time);
        }
        this._hihat(time, barBeat % 2 === 0 ? 0.06 : 0.03);

        if (halfBeat) {
            const bassIdx = Math.floor(beat / 2) % 8;
            const bassNotes = [55, 55, 73.42, 65.41, 55, 55, 82.41, 73.42];
            this._bass(time, bassNotes[bassIdx]);
        }

        if (barBeat === 0 || barBeat === 8) {
            const chordIdx = (Math.floor(beat / 8)) % 4;
            const chords = [
                [220, 261.63, 329.63],
                [174.61, 220, 261.63],
                [261.63, 329.63, 392],
                [196, 246.94, 293.66]
            ];
            this._pad(time, chords[chordIdx], this.beatLen * 4);
        }

        const arpIdx = beat % 6;
        const arpNotes = [440, 523.25, 659.25, 783.99, 659.25, 523.25];
        this._arp(time, arpNotes[arpIdx]);
    }

    // --- Instruments ---

    _kick(time) {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(30, time + 0.15);
        g.gain.setValueAtTime(0.5, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
        osc.connect(g); g.connect(this.musicGain);
        osc.start(time); osc.stop(time + 0.3);
    }

    _snare(time) {
        const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.12, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        const noise = this.ctx.createBufferSource();
        noise.buffer = buf;
        const ng = this.ctx.createGain();
        const hp = this.ctx.createBiquadFilter();
        hp.type = 'highpass'; hp.frequency.value = 2000;
        ng.gain.setValueAtTime(0.18, time);
        ng.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
        noise.connect(hp); hp.connect(ng); ng.connect(this.musicGain);
        noise.start(time); noise.stop(time + 0.15);

        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'triangle'; osc.frequency.value = 180;
        g.gain.setValueAtTime(0.12, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
        osc.connect(g); g.connect(this.musicGain);
        osc.start(time); osc.stop(time + 0.1);
    }

    _hihat(time, vol) {
        const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.04, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        const noise = this.ctx.createBufferSource();
        noise.buffer = buf;
        const g = this.ctx.createGain();
        const hp = this.ctx.createBiquadFilter();
        hp.type = 'highpass'; hp.frequency.value = 8000;
        g.gain.setValueAtTime(vol, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
        noise.connect(hp); hp.connect(g); g.connect(this.musicGain);
        noise.start(time); noise.stop(time + 0.05);
    }

    _bass(time, freq) {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        const filt = this.ctx.createBiquadFilter();
        filt.type = 'lowpass'; filt.Q.value = 6;
        filt.frequency.setValueAtTime(this.bassFilterCutoff, time);
        filt.frequency.exponentialRampToValueAtTime(120, time + this.beatLen * 0.8);
        osc.type = this.bassWave; osc.frequency.value = freq;
        g.gain.setValueAtTime(0.18, time);
        g.gain.exponentialRampToValueAtTime(0.01, time + this.beatLen * 0.9);
        osc.connect(filt); filt.connect(g); g.connect(this.musicGain);
        osc.start(time); osc.stop(time + this.beatLen);
    }

    _pad(time, freqs, dur) {
        for (const freq of freqs) {
            for (const detune of [-8, 0, 8]) {
                const osc = this.ctx.createOscillator();
                const g = this.ctx.createGain();
                const filt = this.ctx.createBiquadFilter();
                filt.type = 'lowpass'; filt.frequency.value = this.padFilterCutoff;
                osc.type = this.padWave; osc.frequency.value = freq;
                osc.detune.value = detune;
                g.gain.setValueAtTime(0, time);
                g.gain.linearRampToValueAtTime(0.025, time + 0.4);
                g.gain.setValueAtTime(0.025, time + dur - 0.4);
                g.gain.linearRampToValueAtTime(0, time + dur);
                osc.connect(filt); filt.connect(g);
                g.connect(this.reverb); g.connect(this.musicGain);
                osc.start(time); osc.stop(time + dur + 0.05);
            }
        }
    }

    _arp(time, freq) {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = this.arpWave; osc.frequency.value = freq;
        const dur = this.beatLen / 2;
        g.gain.setValueAtTime(0.05, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + dur * 0.7);
        osc.connect(g); g.connect(this.delay); g.connect(this.reverb);
        osc.start(time); osc.stop(time + dur);
    }

    // --- SFX ---

    playCollision() {
        if (!this.started) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.exponentialRampToValueAtTime(50, t + 0.3);
        g.gain.setValueAtTime(0.3, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.connect(g); g.connect(this.sfxGain);
        osc.start(t); osc.stop(t + 0.35);
    }

    playBoost() {
        if (!this.started) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(800, t + 0.2);
        g.gain.setValueAtTime(0.12, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.connect(g); g.connect(this.sfxGain);
        osc.start(t); osc.stop(t + 0.35);
    }

    playDismount() {
        if (!this.started) return;
        const t = this.ctx.currentTime;
        [600, 450, 300].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'square'; osc.frequency.value = freq;
            g.gain.setValueAtTime(0.08, t + i * 0.06);
            g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.1);
            osc.connect(g); g.connect(this.sfxGain);
            osc.start(t + i * 0.06); osc.stop(t + i * 0.06 + 0.12);
        });
    }

    playMount() {
        if (!this.started) return;
        const t = this.ctx.currentTime;
        [300, 450, 600].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'square'; osc.frequency.value = freq;
            g.gain.setValueAtTime(0.08, t + i * 0.06);
            g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.1);
            osc.connect(g); g.connect(this.sfxGain);
            osc.start(t + i * 0.06); osc.stop(t + i * 0.06 + 0.12);
        });
    }

    playDeath() {
        if (!this.started) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.exponentialRampToValueAtTime(20, t + 1.2);
        g.gain.setValueAtTime(0.25, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
        osc.connect(g); g.connect(this.reverb); g.connect(this.sfxGain);
        osc.start(t); osc.stop(t + 1.3);
    }

    playScore() {
        if (!this.started) return;
        const t = this.ctx.currentTime;
        [523.25, 659.25, 783.99].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'sine'; osc.frequency.value = freq;
            g.gain.setValueAtTime(0.1, t + i * 0.08);
            g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.15);
            osc.connect(g); g.connect(this.sfxGain);
            osc.start(t + i * 0.08); osc.stop(t + i * 0.08 + 0.2);
        });
    }

    // --- Disc Weapon SFX ---

    playDiscFire() {
        if (!this.started) return;
        const t = this.ctx.currentTime;
        // Rising sweep
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.exponentialRampToValueAtTime(1200, t + 0.1);
        g.gain.setValueAtTime(0.15, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.connect(g); g.connect(this.sfxGain);
        osc.start(t); osc.stop(t + 0.25);
        // Noise burst
        const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.05, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        const noise = this.ctx.createBufferSource();
        noise.buffer = buf;
        const ng = this.ctx.createGain();
        const bp = this.ctx.createBiquadFilter();
        bp.type = 'bandpass'; bp.frequency.value = 3000;
        ng.gain.setValueAtTime(0.08, t);
        ng.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        noise.connect(bp); bp.connect(ng); ng.connect(this.sfxGain);
        noise.start(t); noise.stop(t + 0.1);
    }

    playDiscHit() {
        if (!this.started) return;
        const t = this.ctx.currentTime;
        // Impact
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.2);
        g.gain.setValueAtTime(0.25, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.connect(g); g.connect(this.sfxGain);
        osc.start(t); osc.stop(t + 0.35);
        // Metallic ring
        const osc2 = this.ctx.createOscillator();
        const g2 = this.ctx.createGain();
        osc2.type = 'square'; osc2.frequency.value = 880;
        g2.gain.setValueAtTime(0.08, t);
        g2.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc2.connect(g2); g2.connect(this.reverb);
        osc2.start(t); osc2.stop(t + 0.2);
    }

    playDiscBounce() {
        if (!this.started) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1000, t);
        osc.frequency.exponentialRampToValueAtTime(500, t + 0.1);
        g.gain.setValueAtTime(0.1, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        osc.connect(g); g.connect(this.sfxGain);
        osc.start(t); osc.stop(t + 0.15);
    }
}
