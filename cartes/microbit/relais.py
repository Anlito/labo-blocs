# Labo Blocs -- micro:bit relais (programme 0.5, decision de Thomas du 24/11/2026).
# Branchee en USB sur l'ordinateur, elle remplace le cable du robot MOVE Motor : chaque ligne recue de Labo Blocs part
# par radio vers le robot du meme canal, chaque reponse du robot revient vers Labo Blocs. Labo Blocs la voit comme le
# cable : mode "En direct", envoi du programme, "Vider la carte".
# Canal (1 a 9, un par equipe, le meme sur le robot) : affiche sur l'ecran ; A le baisse, B l'augmente ; garde dans
# le fichier "canal". Robot absent ou eteint : au PING, le relais repond lui-meme "PONG v2 0.5 relais-<canal> 0 0"
# pour que Labo Blocs le dise en clair.
from microbit import *
import radio

VERSION = '0.5'


def lire_canal():
    try:
        with open('canal') as f:
            return max(1, min(9, int(f.read())))
    except (OSError, ValueError):
        return 1


canal = lire_canal()


def regler(c):
    global canal
    canal = c
    with open('canal', 'w') as f:
        f.write(str(c))
    radio.config(group=c, length=120, queue=20, power=7)
    display.show(str(c))


uart.init(115200)
radio.on()
regler(canal)
ligne = b''
ping = 0  # heure du PING en attente de la reponse du robot (0 : rien en attente)
while True:
    if button_a.was_pressed() and canal > 1:
        regler(canal - 1)
    if button_b.was_pressed() and canal < 9:
        regler(canal + 1)
    d = uart.read()
    if d:
        for o in d:
            if o == 10:
                l = ligne.strip()
                if l:
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
