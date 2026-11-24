# Labo Blocs -- robot Kitronik MOVE Motor (programme de la micro:bit 0.4, extension 6).
# Fichier a part, importe par main.py seulement quand un programme commande le robot : main.py doit rester assez
# petit pour etre compile au demarrage (au-dela de 14 Ko environ : MemoryError, essai du 20/11/2026).
# Commandes : 0 preparer le robot, 1 moteurs (gauche, droite : -100 a 100), 2 un moteur (1 gauche, 2 droit, vitesse),
# 3 ultrasons -> cm (400 : rien devant), 4 suivi de ligne (1 gauche P2, 2 droit P1) -> 0 a 1023,
# 5 LED (0 toutes, 1 avant gauche, 2 avant droite, 3 arriere droite, 4 arriere gauche ; rouge, vert, bleu).
# Comme l'extension MakeCode de Kitronik : carte du robot V1.0 / V1.3 = moteurs par PCA9632 (I2C 0x62), V3.1 = 6 octets
# facon WS2811 sur P12 (droite avant, arriere, frein ; gauche arriere, avant, frein). Branchements verifies sur le
# robot de Thomas (carte V3.1, RECETTE 33).
from microbit import *
import neopixel
from machine import time_pulse_us
from utime import sleep_us


def version():
    # V1.3 : P12 suit P3 (P3 sert aussi a l'ecran : ecran eteint pendant le test).
    display.off()
    pin3.write_digital(1)
    sleep(100)
    v = ''
    if pin12.read_digital():
        pin3.write_digital(0)
        sleep(100)
        if not pin12.read_digital():
            v = '1.3'
    pin3.write_digital(0)
    display.on()
    if v:
        return v
    try:
        i2c.write(0x62, bytes([1, 13]))
        i2c.write(0x62, bytes([1]), repeat=True)
        if i2c.read(0x62, 1)[0] == 13:
            return '1.0'
    except OSError:
        pass
    return '3.1'


V = version()
if V == '3.1':
    NP = neopixel.NeoPixel(pin12, 2)
else:
    i2c.write(0x62, bytes([1, 13]))   # MODE2 : sorties totem
    i2c.write(0x62, bytes([8, 170]))  # LEDOUT : 4 sorties en PWM
    i2c.write(0x62, bytes([0, 0]))    # MODE1 : reveil
ZIP = neopixel.NeoPixel(pin8, 4)
M = [0, 0]  # vitesses envoyees (0 a 255, avec le signe du sens)


def envoyer(g, d):
    if V == '3.1':
        o = (max(d, 0), max(-d, 0), 0 if d else 255, max(-g, 0), max(g, 0), 0 if g else 255)
        # NeoPixel recoit (rouge, vert, bleu) et envoie vert, rouge, bleu : on croise pour garder l'ordre des octets.
        NP[0] = (o[1], o[0], o[2])
        NP[1] = (o[4], o[3], o[5])
        NP.show()
    else:
        i2c.write(0x62, bytes([0xA2, max(-d, 0), max(d, 0), max(g, 0), max(-g, 0)]))


def octet(v):
    return max(-255, min(255, int(v * 2.55 + (0.5 if v > 0 else -0.5))))


def moteurs(g, d):
    # g, d en octets signes
    # Demarrage : 1 ms a fond dans le bon sens (comme Kitronik), pour que les petites vitesses partent.
    if (g and not M[0]) or (d and not M[1]):
        envoyer(255 if g > 0 else -255 if g else 0, 255 if d > 0 else -255 if d else 0)
        sleep(1)
    M[0] = g
    M[1] = d
    envoyer(g, d)


def commande(c, a):
    if c == 1:
        moteurs(octet(a[0]), octet(a[1]))
    elif c == 2:
        if int(a[0]) == 1:
            moteurs(octet(a[1]), M[1])
        elif int(a[0]) == 2:
            moteurs(M[0], octet(a[1]))
    elif c == 3:
        pin14.read_digital()
        pin13.write_digital(1)
        sleep_us(10)
        pin13.write_digital(0)
        t = time_pulse_us(pin14, 1, 25000)
        return 400 if t < 0 else min(400, t // 58)
    elif c == 4:
        # sans la resistance interne (voir h_lire_ana dans main.py) : 124 au lieu de 566 sur du blanc sinon
        p = pin1 if int(a[0]) == 2 else pin2
        p.read_digital()
        p.set_pull(p.NO_PULL)
        return p.read_analog()
    elif c == 5:
        q = int(a[0])
        coul = (max(0, min(255, int(a[1]))), max(0, min(255, int(a[2]))), max(0, min(255, int(a[3]))))
        for i in range(4):
            if q == 0 or q == i + 1:
                ZIP[i] = coul
        ZIP.show()
    return 0


def eteindre():
    M[0] = 0
    M[1] = 0
    envoyer(0, 0)
    ZIP.clear()
    ZIP.show()


pin14.read_digital()
pin13.write_digital(0)
eteindre()
