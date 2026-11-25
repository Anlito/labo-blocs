# Labo Blocs -- micro:bit relais (programme 0.5, decision de Thomas du 24/11/2026).
# Branchee en USB sur l'ordinateur, elle remplace le cable du robot MOVE Motor : chaque ligne recue de Labo Blocs part
# par radio vers le robot du meme canal, chaque reponse du robot revient vers Labo Blocs. Labo Blocs la voit comme le
# cable : mode "En direct", envoi du programme, "Vider la carte".
# Telecommande (25/11/2026) : tenue en main, elle repond elle-meme aux lectures de l'extension 7 (sans le robot) :
#   "X 7 1 <axe>" inclinaison (1 gauche-droite, 2 avant-arriere) -> -100 a 100 ; "X 7 2 <n>" bouton (1 A, 2 B) -> 0/1.
# Canal (1 a 9, un par equipe, le meme sur le robot) : affiche sur l'ecran. Pour le changer : brancher la micro:bit en
# tenant A jusqu'a ce que le chiffre clignote, A change, B garde (A et B servent ensuite de boutons de telecommande).
# Robot absent ou eteint : au PING, le relais repond lui-meme "PONG v2 0.5 relais-<canal> 0 0".
from microbit import *
import radio

VERSION = '0.5'


def lire_canal():
    try:
        with open('canal') as f:
            return max(1, min(9, int(f.read())))
    except (OSError, ValueError):
        return 1


def choisir(c):
    while button_a.is_pressed():
        display.show(str(c))
        sleep(150)
        display.clear()
        sleep(150)
    button_a.was_pressed()
    button_b.was_pressed()
    display.show(str(c))
    while not button_b.was_pressed():
        if button_a.was_pressed():
            c = c % 9 + 1
            display.show(str(c))
        sleep(20)
    with open('canal', 'w') as f:
        f.write(str(c))
    return c


def telecommande(m):
    # "X 7 <commande> <argument>" -> "V <valeur>"
    try:
        c, n = int(m[4:].split()[0]), int(m[4:].split()[1])
    except (ValueError, IndexError):
        return 'ERR CMD'
    if c == 1:
        v = accelerometer.get_y() if n == 2 else accelerometer.get_x()
        return 'V %d' % max(-100, min(100, int(v / 10)))
    if c == 2:
        return 'V %d' % (1 if (button_b if n == 2 else button_a).is_pressed() else 0)
    return 'V 0'


canal = lire_canal()
if button_a.is_pressed():
    canal = choisir(canal)
uart.init(115200)
radio.config(group=canal, length=120, queue=20, power=7)
radio.on()
display.show(str(canal))
ligne = b''
ping = 0  # heure du PING en attente de la reponse du robot (0 : rien en attente)
while True:
    d = uart.read()
    if d:
        for o in d:
            if o == 10:
                l = ligne.strip()
                if l.startswith(b'X 7 '):
                    uart.write((telecommande(str(l, 'utf8')) + '\n').encode())
                elif l:
                    if l == b'PING':
                        ping = running_time() | 1
                    radio.send_bytes(l)
                ligne = b''
            elif o != 13 and len(ligne) < 110:
                ligne += bytes((o,))
    m = radio.receive_bytes()
    while m:
        if m.startswith(b'PONG'):
            # le robot a repondu : on ajoute le canal pour que Labo Blocs sache qu'il passe par le relais
            ping = 0
            m = m + b' relais ' + str(canal).encode()
        uart.write(m + b'\n')
        m = radio.receive_bytes()
    if ping and running_time() - ping > 500:
        uart.write(('PONG v2 %s relais-%d 0 0\n' % (VERSION, canal)).encode())
        ping = 0
    sleep(1)
