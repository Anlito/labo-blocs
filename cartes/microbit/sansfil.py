# Labo Blocs -- robot pilote par une micro:bit relais (programme 0.5) : la radio du robot.
# Importe par main.py au demarrage seulement si le robot a un canal (fichier "canal"), ou si on tient le bouton A en
# l'allumant jusqu'a ce que le chiffre s'affiche (2 s environ) : A le change (1 a 9), B le garde. Une micro:bit sans canal ne touche pas a la radio.
# Les lignes recues par radio sont traitees comme celles du cable ; les reponses repartent par les deux.
from microbit import *
import radio


def lire_canal():
    try:
        with open('canal') as f:
            return max(1, min(9, int(f.read())))
    except (OSError, ValueError):
        return 0


def choisir(c):
    c = c or 1
    display.show(str(c))
    while button_a.is_pressed():
        sleep(20)
    button_a.was_pressed()
    button_b.was_pressed()
    while not button_b.was_pressed():
        if button_a.was_pressed():
            c = c % 9 + 1
            display.show(str(c))
        sleep(20)
    with open('canal', 'w') as f:
        f.write(str(c))
    display.show(Image.YES)
    sleep(600)
    display.clear()
    return c


def demarrer(choix):
    c = lire_canal()
    if choix:
        c = choisir(c)
    radio.config(group=c, length=120, queue=20, power=7)
    radio.on()


def recevoir():
    m = radio.receive_bytes()
    return str(m, 'utf8') if m else None


def envoyer(t):
    radio.send_bytes(t.encode())
