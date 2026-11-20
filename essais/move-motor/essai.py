# Essai du robot Kitronik MOVE Motor (jalon 0 du MOVE Motor, 20/11/2026) — micro:bit V2, MicroPython 2.1.2.
# Programme jetable : vérifier sur le vrai robot ce que dit l'extension MakeCode de Kitronik
# (github.com/KitronikLtd/pxt-kitronik-move-motor, main.ts) avant d'écrire le programme de la carte.
#
# Robot posé sur une boîte, ROUES EN L'AIR. Bouton A : étape suivante. Bouton B : refaire l'étape.
# Le numéro de l'étape s'affiche avant chaque étape ; la flèche → veut dire « appuie sur A ».
#   1 version de la carte du robot (défile : V1.0, V1.3 ou V3.1)
#   2 roue gauche : avant 2 s, puis arrière 2 s
#   3 roue droite : avant 2 s, puis arrière 2 s
#   4 les deux roues en avant 3 s (même vitesse ?)
#   5 LED de couleur : une par une en rouge (le numéro s'affiche), puis toutes rouge, vert, bleu
#   6 klaxon : 2 bips avec le haut-parleur de la micro:bit, puis 2 bips haut-parleur coupé
#   7 capteurs : distance (d…) puis suivi de ligne (G… D…), en boucle jusqu'au bouton A
from microbit import *
import machine
import music
import neopixel
import utime

ADRESSE = 0x62  # PCA9632, pilote des moteurs des cartes V1.0 et V1.3
VITESSE = 60    # % pour les essais de roues


def detecter_version():
    # Comme Kitronik : P3 à 1 puis à 0, et P12 suit sur la V1.3. P3 sert aussi à l'écran : écran éteint pendant le test.
    display.off()
    version = None
    pin3.write_digital(1)
    sleep(100)
    if pin12.read_digital() == 1:
        pin3.write_digital(0)
        sleep(100)
        if pin12.read_digital() == 0:
            version = '1.3'
    pin3.write_digital(0)
    display.on()
    if version:
        return version
    # Sinon : le PCA9632 répond-il sur le bus I2C ? Oui → V1.0 ; non → V3.1 (moteurs pilotés par P12).
    try:
        i2c.write(ADRESSE, bytes([0x01, 0x0D]))
        i2c.write(ADRESSE, bytes([0x01]), repeat=True)
        if i2c.read(ADRESSE, 1)[0] == 0x0D:
            return '1.0'
    except OSError:
        pass
    return '3.1'


class Moteurs:
    def __init__(self, version):
        self.v31 = version == '3.1'
        if self.v31:
            # 6 octets envoyés sur P12 comme des LED WS2811 : droite avant, arrière, frein ; gauche arrière, avant, frein.
            self.ruban = neopixel.NeoPixel(pin12, 2)
            self.octets = [0, 0, 255, 0, 0, 255]
        else:
            i2c.write(ADRESSE, bytes([0x01, 0x0D]))  # MODE2 : sorties totem
            i2c.write(ADRESSE, bytes([0x08, 0xAA]))  # LEDOUT : 4 sorties en PWM
            i2c.write(ADRESSE, bytes([0x00, 0x00]))  # MODE1 : réveil
            sleep(1)
            self.pwm = [0, 0, 0, 0]  # PWM0 droite arrière, PWM1 droite avant, PWM2 gauche avant, PWM3 gauche arrière
        self.envoyer()

    def envoyer(self):
        if self.v31:
            o = self.octets
            # NeoPixel reçoit (rouge, vert, bleu) et envoie vert, rouge, bleu : on croise pour garder l'ordre des octets.
            self.ruban[0] = (o[1], o[0], o[2])
            self.ruban[1] = (o[4], o[3], o[5])
            self.ruban.show()
        else:
            i2c.write(ADRESSE, bytes([0xA2] + self.pwm))

    def regler(self, cote, vitesse):
        # cote 'G' ou 'D' ; vitesse de -100 (arrière) à 100 (avant)
        v = min(255, round(abs(vitesse) * 2.55))
        av = v if vitesse > 0 else 0
        ar = v if vitesse < 0 else 0
        if self.v31:
            o = self.octets
            if cote == 'D':
                o[0], o[1], o[2] = av, ar, (255 if v == 0 else 0)
            else:
                o[4], o[3], o[5] = av, ar, (255 if v == 0 else 0)
        else:
            if cote == 'D':
                self.pwm[1], self.pwm[0] = av, ar
            else:
                self.pwm[2], self.pwm[3] = av, ar
        self.envoyer()

    def arreter(self):
        self.regler('G', 0)
        self.regler('D', 0)


def distance_cm():
    pin13.write_digital(0)
    utime.sleep_us(2)
    pin13.write_digital(1)
    utime.sleep_us(10)
    pin13.write_digital(0)
    t = machine.time_pulse_us(pin14, 1, 30000)
    if t < 0:
        return -1  # rien reçu : capteur absent ou rien devant (plus de 5 m)
    return t // 58  # 58 µs par cm aller-retour (valeur de Kitronik pour la micro:bit V2)


def defiler(texte):
    print(texte)
    display.scroll(texte, delay=70)


# ---------- Étapes ----------

def etape_version():
    defiler('V' + VERSION)


def etape_roue(cote):
    display.show(cote)
    sleep(600)
    display.show(Image.ARROW_N)
    moteurs.regler(cote, VITESSE)
    sleep(2000)
    moteurs.arreter()
    sleep(600)
    display.show(Image.ARROW_S)
    moteurs.regler(cote, -VITESSE)
    sleep(2000)
    moteurs.arreter()


def etape_deux_roues():
    display.show(Image.ARROW_N)
    moteurs.regler('G', VITESSE)
    moteurs.regler('D', VITESSE)
    sleep(3000)
    moteurs.arreter()


def etape_led():
    leds.clear()
    leds.show()
    for i in range(4):
        leds.clear()
        leds[i] = (60, 0, 0)
        leds.show()
        display.show(str(i + 1))
        sleep(1500)
    for couleur, lettre in (((60, 0, 0), 'R'), ((0, 60, 0), 'V'), ((0, 0, 60), 'B')):
        for i in range(4):
            leds[i] = couleur
        leds.show()
        display.show(lettre)
        sleep(1200)
    leds.clear()
    leds.show()


def etape_klaxon():
    speaker.on()
    display.show('1')
    for _ in range(2):
        music.pitch(185, 300)
        sleep(200)
    sleep(800)
    speaker.off()  # si on entend encore : le robot a son propre buzzer sur P0
    display.show('2')
    for _ in range(2):
        music.pitch(185, 300)
        sleep(200)
    speaker.on()


def barre(colonnes, hauteur):
    # Barre allumée du bas vers le haut (hauteur 0 à 5) sur les colonnes données.
    for x in colonnes:
        for y in range(5):
            display.set_pixel(x, 4 - y, 9 if y < hauteur else 0)


def etape_capteurs():
    # En boucle jusqu'au bouton A, qui passe directement à l'étape suivante.
    # Écran : 2 colonnes de gauche = capteur de ligne gauche, 2 de droite = capteur droit (plus c'est haut, plus la
    # valeur est grande), colonne du milieu = distance (1 point par 10 cm, rien si plus de 50 cm ou rien devant).
    # Les nombres partent aussi par le câble USB (page essais/move-motor/capteurs.html).
    button_a.was_pressed()
    display.clear()
    while not button_a.was_pressed():
        d = distance_cm()
        g = pin2.read_analog()
        dr = pin1.read_analog()
        print('d=' + str(d) + ' G=' + str(g) + ' D=' + str(dr))
        barre((0, 1), (g * 6) // 1024)
        barre((3, 4), (dr * 6) // 1024)
        barre((2,), 0 if d < 0 else min(5, (d + 9) // 10))
        sleep(150)
    return True


ETAPES = (
    etape_version,
    lambda: etape_roue('G'),
    lambda: etape_roue('D'),
    etape_deux_roues,
    etape_led,
    etape_klaxon,
    etape_capteurs,
)

VERSION = detecter_version()
moteurs = Moteurs(VERSION)
leds = neopixel.NeoPixel(pin8, 4)
leds.clear()
leds.show()
pin14.read_digital()  # écho des ultrasons en entrée
pin13.write_digital(0)

numero = 0
while True:
    display.show(str(numero + 1))
    sleep(800)
    deja_suivante = ETAPES[numero]()
    moteurs.arreter()
    if deja_suivante:
        numero = (numero + 1) % len(ETAPES)
        continue
    display.show(Image.ARROW_E)
    button_a.was_pressed()
    button_b.was_pressed()
    while True:
        if button_a.was_pressed():
            numero = (numero + 1) % len(ETAPES)
            break
        if button_b.was_pressed():
            break
        sleep(50)
