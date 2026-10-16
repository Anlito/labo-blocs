# Faux module « microbit » pour faire tourner main.py sur l'ordinateur (tests) : rien n'y fait quoi que ce soit.
class _Rien:
    def __getattr__(self, nom):
        return _Rien()
    def __call__(self, *a, **k):
        return 0
display = button_a = button_b = accelerometer = uart = Image = pin_logo = _Rien()
temperature = sleep = running_time = _Rien()
pin0 = pin1 = pin2 = pin3 = pin4 = pin5 = pin6 = pin7 = pin8 = pin9 = pin10 = _Rien()
pin11 = pin12 = pin13 = pin14 = pin15 = pin16 = pin17 = pin18 = pin19 = pin20 = _Rien()
