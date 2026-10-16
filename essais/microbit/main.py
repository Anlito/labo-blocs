# Labo Blocs pour micro:bit V1 et V2 (MicroPython) -- essai du jalon 0.
# Meme role que le firmware Uno (essais/firmware/labo_blocs) : il garde le programme de l'eleve (code octet)
# dans le fichier "prog.lb", le lance a chaque mise sous tension, et obeit au protocole direct v2 sur le port USB.
# Il reprend a l'identique les regles de l'interpreteur C (vm.c) : memes instructions, memes fils, memes arrondis.
# Ecrit pour le MicroPython de la V1 (ancien, peu de memoire) : pas de f-string, peu de classes, code compact.
from microbit import *
import music

FMT = 1
CAP = 1024
TRANCHE = 200
FICHIER = 'prog.lb'
try:
    import os
    os.uname
    V2 = 'v2' in str(os.uname()).lower() or hasattr(__import__('microbit'), 'microphone')
except Exception:
    V2 = False
CARTE = 'microbit-v2' if V2 else 'microbit-v1'
# Broches libres (les autres servent a l'ecran, aux boutons A/B et a l'I2C).
LIBRES = (0, 1, 2, 8, 12, 13, 14, 15, 16)

# ---------- Materiel ----------
def broche(n):
    return globals()['pin%d' % n]

servos = {}
def h_config(b, t):
    try:
        p = broche(b)
        if t in (1, 5, 7):
            p.write_digital(0)
        elif t == 2:
            p.read_digital()
            p.set_pull(p.PULL_UP)
        elif t == 3:
            p.read_digital()
            p.set_pull(p.NO_PULL)
    except Exception:
        pass

def h_num(b, v):
    broche(b).write_digital(1 if v else 0)

def h_ana(b, v):
    broche(b).write_analog(v * 1023 // 255)

def h_servo(b, a):
    p = broche(b)
    if b not in servos:
        p.set_analog_period(20)
        servos[b] = 1
    # 0,5 ms a 2,5 ms sur une periode de 20 ms
    p.write_analog(int((0.5 + a / 90) * 1023 / 20 + 0.5))

def h_son(b, f, ms):
    music.pitch(f, ms, pin=broche(b), wait=False)

def h_silence(b):
    music.stop()

def h_lire(b, t):
    v = broche(b).read_digital()
    return (1 - v) if t == 2 else v

def h_lire_ana(b):
    return broche(b).read_analog()

import random
def h_hasard(a, b):
    return random.randint(a, b)

# Extension 2 = micro:bit : 1 afficher un nombre, 2 image n, 3 pixel(x, y, 0..9), 4 effacer, 5 bouton A,
# 6 bouton B, 7 acceleration (axe 1 x, 2 y, 3 z) en mg, 8 temperature, 9 logo touche (V2), 10 lumiere
IMAGES = None
def h_ext(e, c, a):
    global IMAGES
    if e != 2:
        return 0
    if c == 1:
        v = a[0]
        display.show(str(int(v)) if v == int(v) else str(v), wait=False)
    elif c == 2:
        if IMAGES is None:
            IMAGES = (Image.HAPPY, Image.SAD, Image.HEART, Image.YES, Image.NO, Image.ARROW_N, Image.ARROW_E, Image.ARROW_S, Image.ARROW_W)
        n = int(a[0]) - 1
        if 0 <= n < len(IMAGES):
            display.show(IMAGES[n])
    elif c == 3:
        display.set_pixel(int(a[0]) % 5, int(a[1]) % 5, max(0, min(9, int(a[2]))))
    elif c == 4:
        display.clear()
    elif c == 5:
        return 1 if button_a.is_pressed() else 0
    elif c == 6:
        return 1 if button_b.is_pressed() else 0
    elif c == 7:
        return (accelerometer.get_x, accelerometer.get_y, accelerometer.get_z)[int(a[0]) - 1 if 1 <= a[0] <= 3 else 0]()
    elif c == 8:
        return temperature()
    elif c == 9:
        return 1 if V2 and pin_logo.is_touched() else 0
    elif c == 10:
        return display.read_light_level()
    return 0

H = {'config': h_config, 'num': h_num, 'ana': h_ana, 'servo': h_servo, 'son': h_son, 'silence': h_silence,
     'lire': h_lire, 'lire_ana': h_lire_ana, 'hasard': h_hasard, 'ext': h_ext}

# ---------- Interpreteur (meme comportement que vm.c) ----------
P = b''        # programme
fils = []      # [actif, type, broche, debut, pc, reveil, tour, pile, appels, dernier]
vars_ = []
listes = []    # [capacite, elements]
types = {}
etat = {'marche': 0, 'demfini': 0, 'origine': 0, 'erreur': 1, 'long': 0}

def u16(a):
    return P[a] | (P[a + 1] << 8)

def f32(a):
    v = P[a] | (P[a + 1] << 8) | (P[a + 2] << 16) | (P[a + 3] << 24)
    e = (v >> 23) & 255
    m = v & 0x7FFFFF
    if e == 0:
        x = m * 2.0 ** -149
    elif e == 255:
        x = 0.0
    else:
        x = (1 + m / 8388608) * 2.0 ** (e - 127)
    return -x if v >> 31 else x

def crc16(crc, o):
    crc ^= o << 8
    for _ in range(8):
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF if crc & 0x8000 else (crc << 1) & 0xFFFF
    return crc

def arrondi(x):
    return int(x + 0.5) if x >= 0 else -int(-x + 0.5)

def charger(donnees):
    global P, fils, vars_, listes, types
    P = bytes(donnees)
    etat['marche'] = 0
    fils = []
    if len(P) < 11 or P[0] != 76 or P[1] != 66:
        etat['erreur'] = 1
        return 1
    if P[2] != FMT:
        etat['erreur'] = 2
        return 2
    n = u16(3)
    if n < 11 or n > len(P) or n > CAP:
        etat['erreur'] = 3
        return 3
    c = 0xFFFF
    for i in range(7, n):
        c = crc16(c, P[i])
    if c != u16(5):
        etat['erreur'] = 3
        return 3
    a = 7
    vars_ = [0] * P[a]
    nl = P[a + 1]
    a += 2
    listes = []
    for i in range(nl):
        listes.append([P[a], []])
        a += 1
    types = {}
    for i in range(P[a]):
        types[P[a + 1 + 2 * i]] = P[a + 2 + 2 * i]
    a += 1 + 2 * P[a]
    nf = P[a]
    a += 1
    if len(vars_) > 24 or nl > 4 or nf > 6:
        etat['erreur'] = 4
        return 4
    for i in range(nf):
        fils.append([0, P[a], P[a + 1], u16(a + 2), 0, 0, 0, [], [], 0])
        a += 4
    etat['erreur'] = 0
    etat['long'] = n
    return 0

def lancer(f, t):
    f[0] = 1
    f[4] = f[3]
    f[5] = t
    f[6] = t
    f[7] = []
    f[8] = []

def demarrer(t):
    if etat['erreur']:
        return
    etat['origine'] = t
    for i in range(len(vars_)):
        vars_[i] = 0
    for l in listes:
        l[1] = []
    for b in types:
        H['config'](b, types[b])
    etat['demfini'] = 0
    for f in fils:
        f[0] = 0
        if f[1] == 0:
            lancer(f, t)
    etat['marche'] = 1

def arreter():
    etat['marche'] = 0
    for f in fils:
        f[0] = 0

def egal(a, b):
    m = max(abs(a), abs(b), 1)
    return abs(a - b) <= 1e-5 * m

def courir(f, t):
    s = f[7]
    for _ in range(TRANCHE):
        pc = f[4]
        op = P[pc]
        pc += 1
        if op == 0 or op == 0x29:
            if f[1] == 1 or op == 0x29:
                if op == 0:
                    f[4] = f[3]
                    f[7] = []
                    f[8] = []
                else:
                    f[4] = pc
                f[5] = t + 1 if t == f[6] else t
                f[6] = f[5]
                return 1
            f[0] = 0
            return 1
        if op == 1:
            s.append(f32(pc))
            pc += 4
        elif op == 2:
            x = P[pc]
            s.append(x - 256 if x > 127 else x)
            pc += 1
        elif op == 3:
            x = P[pc]
            s.append(vars_[x] if x < len(vars_) else 0)
            pc += 1
        elif op == 4:
            x = P[pc]
            v = s.pop()
            if x < len(vars_):
                vars_[x] = v
            pc += 1
        elif 5 <= op <= 0x11:
            b = s.pop()
            a = s.pop()
            if op == 5: r = a + b
            elif op == 6: r = a - b
            elif op == 7: r = a * b
            elif op == 8: r = 0 if b == 0 else a / b
            elif op == 9:
                if b == 0:
                    r = 0
                else:
                    r = a - b * int(a / b)
                    if r != 0 and (r < 0) != (b < 0):
                        r += b
            elif op == 0x0A: r = 1 if egal(a, b) else 0
            elif op == 0x0B: r = 0 if egal(a, b) else 1
            elif op == 0x0C: r = 1 if a < b and not egal(a, b) else 0
            elif op == 0x0D: r = 1 if a < b or egal(a, b) else 0
            elif op == 0x0E: r = 1 if a > b and not egal(a, b) else 0
            elif op == 0x0F: r = 1 if a > b or egal(a, b) else 0
            elif op == 0x10: r = 1 if a != 0 and b != 0 else 0
            else: r = 1 if a != 0 or b != 0 else 0
            s.append(r)
        elif op == 0x12:
            s.append(1 if s.pop() == 0 else 0)
        elif op == 0x13:
            s.append(-s.pop())
        elif op == 0x14:
            pc = u16(pc)
        elif op == 0x15:
            c = u16(pc)
            pc += 2
            if s.pop() == 0:
                pc = c
        elif op == 0x16:
            x = P[pc]
            pc += 1
            s.append(1 if H['lire'](x, types.get(x, 1)) else 0)
        elif op == 0x17:
            s.append(H['lire_ana'](P[pc]))
            pc += 1
        elif op == 0x18:
            H['num'](P[pc], s.pop() != 0)
            pc += 1
        elif op == 0x19:
            a = s.pop()
            H['ana'](P[pc], 0 if a < 0 else 255 if a > 255 else int(a + 0.5))
            pc += 1
        elif op == 0x1A:
            a = s.pop()
            H['servo'](P[pc], 0 if a < 0 else 180 if a > 180 else int(a + 0.5))
            pc += 1
        elif op == 0x1B:
            b = s.pop()
            a = s.pop()
            H['son'](P[pc], int(31 if a < 31 else 20000 if a > 20000 else a), 0 if b < 0 else int(b * 1000 + 0.5))
            pc += 1
        elif op == 0x1C:
            H['silence'](P[pc])
            pc += 1
        elif op == 0x1D:
            a = s.pop()
            ms = int(a * 1000 + 0.5) if a > 0 else 0
            if ms > 0:
                f[4] = pc
                f[5] = t + ms
                return 1
        elif op == 0x1E:
            b = s.pop()
            a = s.pop()
            s.append(H['hasard'](arrondi(min(a, b)), arrondi(max(a, b))))
        elif op == 0x1F:
            if len(f[8]) >= 6:
                return 0
            f[8].append(pc + 2)
            pc = u16(pc)
        elif op == 0x20:
            if not f[8]:
                return 0
            pc = f[8].pop()
        elif 0x21 <= op <= 0x25:
            x = P[pc]
            pc += 1
            l = listes[x] if x < len(listes) else None
            if op == 0x21:
                i = arrondi(s.pop())
                s.append(l[1][i - 1] if l and 1 <= i <= len(l[1]) else 0)
            elif op == 0x22:
                v = s.pop()
                i = arrondi(s.pop())
                if l and 1 <= i <= len(l[1]):
                    l[1][i - 1] = v
            elif op == 0x23:
                v = s.pop()
                if l and len(l[1]) < l[0]:
                    l[1].append(v)
            elif op == 0x24:
                s.append(len(l[1]) if l else 0)
            elif l:
                l[1] = []
        elif op == 0x26:
            s.append((t - etat['origine']) / 1000)
        elif op == 0x27:
            s.pop()
        elif op == 0x28:
            e = P[pc]
            c = P[pc + 1]
            k = P[pc + 2]
            pc += 3
            if k > 4 or k > len(s):
                return 0
            a = [0] * k
            for i in range(k - 1, -1, -1):
                a[i] = s.pop()
            s.append(H['ext'](e, c, a))
        else:
            return 0
        if len(s) > 12:
            return 0
        f[4] = pc
    f[5] = t + 1
    return 1

def avancer(t):
    if not etat['marche'] or etat['erreur']:
        return -1
    for _ in range(50):
        travail = 0
        if etat['demfini']:
            for f in fils:
                if f[1] in (2, 3):
                    v = 1 if H['lire'](f[2], types.get(f[2], 1)) else 0
                    if v != f[9]:
                        f[9] = v
                        if not f[0] and v == (1 if f[1] == 2 else 0):
                            lancer(f, t)
        for f in fils:
            if f[0] and f[5] <= t:
                try:
                    ok = courir(f, t)
                except (IndexError, KeyError):
                    ok = 0
                if not ok:
                    etat['erreur'] = 5
                    arreter()
                    return -1
                travail = 1
        if not etat['demfini']:
            if not [f for f in fils if f[1] == 0 and f[0]]:
                etat['demfini'] = 1
                for f in fils:
                    if f[1] == 1:
                        lancer(f, t)
                    elif f[1] in (2, 3):
                        f[9] = 1 if H['lire'](f[2], types.get(f[2], 1)) else 0
                travail = 1
        if not travail:
            break
    r = -1
    for f in fils:
        if f[0] and (r < 0 or f[5] < r):
            r = f[5]
    return r

# ---------- Carte : fichier du programme, protocole direct v2 ----------
def lire_fichier():
    try:
        with open(FICHIER, 'rb') as fi:
            return fi.read()
    except OSError:
        return b''

def tout_eteindre():
    arreter()
    music.stop()
    display.clear()
    for b in LIBRES:
        try:
            broche(b).write_digital(0)
        except Exception:
            pass
    servos.clear()
    surv.clear()

def lancer_programme():
    tout_eteindre()
    if charger(lire_fichier()) == 0:
        random.seed(running_time())
        demarrer(running_time())

direct = [0, 0]   # en direct, dernier message
envoi = [-1, b'']  # octets annonces, recus
surv = {}         # broche -> [etat, debut du changement]

def ecrire(t):
    uart.write(t + '\n')

def entiers(mots):
    try:
        return [int(m) for m in mots]
    except ValueError:
        return None

def en_direct():
    if not direct[0]:
        tout_eteindre()
        direct[0] = 1

def commande(l):
    m = l.split()
    if not m:
        return
    c = m[0]
    n = entiers(m[1:]) if c not in ('H', 'M') else None
    if c == 'PING':
        ecrire('PONG v2 0.1 %s %d %d' % (CARTE, etat['long'] if not etat['erreur'] else 0, CAP))
    elif c == 'OFF':
        tout_eteindre()
        ecrire('OK')
    elif c in ('D', 'A', 'S', 'T', 'R', 'RA') and (n is None or len(n) < (1 if c in ('R', 'RA') else 3 if c == 'T' else 2)):
        ecrire('ERR CMD')
    elif c in ('D', 'A', 'S', 'T', 'R', 'RA') and n[0] not in LIBRES:
        ecrire('ERR PIN')
    elif c in ('D', 'A', 'S', 'T'):
        en_direct()
        b = n[0]
        if c == 'D': h_num(b, n[1])
        elif c == 'A': h_ana(b, max(0, min(255, n[1])))
        elif c == 'S': h_servo(b, max(0, min(180, n[1])))
        else: h_son(b, max(31, min(20000, n[1])), max(1, min(10000, n[2])))
        ecrire('OK')
    elif c in ('R', 'RA'):
        en_direct()
        ecrire('V %d %d' % (n[0], broche(n[0]).read_digital() if c == 'R' else broche(n[0]).read_analog()))
    elif c == 'M':
        n = entiers(m[1:2])
        if not n or len(m) < 3 or m[2] not in ('I', 'P', 'O'):
            return ecrire('ERR CMD')
        if n[0] not in LIBRES:
            return ecrire('ERR PIN')
        en_direct()
        p = broche(n[0])
        if m[2] == 'O':
            p.write_digital(0)
        else:
            p.read_digital()
            p.set_pull(p.PULL_UP if m[2] == 'P' else p.NO_PULL)
        ecrire('OK')
    elif c == 'W':
        if n is None or [b for b in n if b not in LIBRES]:
            return ecrire('ERR PIN')
        en_direct()
        surv.clear()
        for b in n[:8]:
            surv[b] = [broche(b).read_digital(), 0]
        ecrire('OK')
    elif c == 'X':
        if n is None or len(n) < 2:
            return ecrire('ERR CMD')
        en_direct()
        ecrire('V %s' % H['ext'](n[0], n[1], n[2:6]))
    elif c == 'PROG':
        if not n:
            return ecrire('ERR CMD')
        if n[0] < 11 or n[0] > CAP:
            return ecrire('ERR TAILLE')
        tout_eteindre()
        direct[0] = 0
        envoi[0] = n[0]
        envoi[1] = b''
        ecrire('OK')
    elif c == 'H':
        if envoi[0] < 0 or len(m) < 2:
            return ecrire('ERR CMD')
        try:
            o = bytes(int(m[1][i:i + 2], 16) for i in range(0, len(m[1]) - 1, 2))
        except ValueError:
            return ecrire('ERR CMD')
        if len(envoi[1]) + len(o) > envoi[0]:
            return ecrire('ERR TAILLE')
        envoi[1] += o
        ecrire('OK')
    elif c == 'FIN':
        if envoi[0] < 0 or len(envoi[1]) != envoi[0]:
            return ecrire('ERR TAILLE')
        d = envoi[1]
        envoi[0] = -1
        envoi[1] = b''
        e = charger(d)
        if e:
            return ecrire('ERR FORMAT' if e == 2 else 'ERR CRC')
        # Fichier ecrit en entier d'un coup : un envoi interrompu ne laisse jamais un programme a moitie ecrit.
        with open(FICHIER, 'wb') as fo:
            fo.write(d)
        ecrire('OK %d' % len(d))
        lancer_programme()
    elif c == 'RUN':
        direct[0] = 0
        lancer_programme()
        ecrire('OK' if etat['marche'] else 'ERR CRC')
    elif c == 'STOP':
        tout_eteindre()
        ecrire('OK')
    elif c == 'EFFACE':
        tout_eteindre()
        direct[0] = 0
        try:
            os.remove(FICHIER)
        except OSError:
            pass
        charger(b'')
        ecrire('OK')
    else:
        ecrire('ERR CMD')

def surveiller(t):
    for b in surv:
        e = surv[b]
        v = broche(b).read_digital()
        if v == e[0]:
            e[1] = 0
        elif not e[1]:
            e[1] = t | 1
        elif t - e[1] >= 20:
            e[0] = v
            e[1] = 0
            ecrire('E %d %d' % (b, v))

def principal():
    uart.init(115200)
    lancer_programme()
    ligne = b''
    while True:
        t = running_time()
        d = uart.read()
        if d:
            for o in d:
                if o == 10:
                    direct[1] = running_time()
                    try:
                        commande(ligne.decode().strip())
                    except Exception:
                        ecrire('ERR CMD')
                    ligne = b''
                elif o != 13 and len(ligne) < 90:
                    ligne += bytes((o,))
        if direct[0]:
            surveiller(t)
            if running_time() - direct[1] > 3000:
                tout_eteindre()
                direct[0] = 0
        elif etat['marche']:
            avancer(t)
        sleep(1)

if __name__ == '__main__':
    principal()
