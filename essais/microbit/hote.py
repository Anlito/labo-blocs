# Interpreteur micro:bit (essais/microbit/main.py) sur l'ordinateur, en temps virtuel : meme entree et meme sortie
# que l'interpreteur C (essais/vm/hote.c), pour verifier que les deux donnent exactement les memes resultats.
#   python3 hote.py programme.bin duree_ms [graine] < entrees      (marche aussi avec le micropython de l'ordinateur)
import sys

# Faux modules « microbit » et « music » (dossier faux/), puis l'interpreteur lui-meme.
_ici = __file__.rsplit('/', 1)[0] if '/' in __file__ else '.'
sys.path.insert(0, _ici)
sys.path.insert(0, _ici + '/faux')
import main as vm

maintenant = [0]
sorties = {}
entrees = {}
graine = [int(sys.argv[3]) if len(sys.argv) > 3 else 12345]

def fmt(v):
    return str(int(v)) if v == int(v) else repr(v)

def changer(b, v, genre):
    if sorties.get(b, 0) != v:
        sorties[b] = v
        print('%d %d %s %s' % (maintenant[0], b, fmt(v), genre))

def hasard(a, b):
    graine[0] = (graine[0] * 1103515245 + 12345) % (1 << 64)  # comme « unsigned long » en C (64 bits)
    return a + (graine[0] >> 8) % (b - a + 1)

def ext(e, c, a):
    print('%d ext %d %d%s' % (maintenant[0], e, c, ''.join(' ' + fmt(x) for x in a)))
    return 0

vm.H.update({
    'config': lambda b, t: None,
    'num': lambda b, v: changer(b, 1 if v else 0, 'led'),
    'ana': lambda b, v: changer(b, v, 'pwm'),
    'servo': lambda b, a: changer(b, a, 'servo'),
    'son': lambda b, f, ms: print('%d %d %d son %d' % (maintenant[0], b, f, ms)),
    'silence': lambda b: print('%d %d 0 son 0' % (maintenant[0], b)),
    'lire': lambda b, t: entrees.get(b, 0),
    'lire_ana': lambda b: entrees.get(b, 0),
    'hasard': hasard,
    'ext': ext,
})

def principal():
    with open(sys.argv[1], 'rb') as f:
        prog = f.read()
    fin = int(sys.argv[2])
    liste = []
    for ligne in sys.stdin.read().split('\n'):
        m = ligne.split()
        if len(m) >= 3:
            liste.append((int(m[0]), int(m[1]), int(m[2]), int(m[3]) if len(m) > 3 else 0))
    e = vm.charger(prog)
    if e:
        print('erreur %d 0' % e)
        return
    vm.demarrer(0)
    i = 0
    while True:
        t = maintenant[0]
        while i < len(liste) and liste[i][0] <= t and not (liste[i][0] == t and liste[i][3]):
            entrees[liste[i][1]] = liste[i][2]
            i += 1
        prochain = vm.avancer(t)
        while i < len(liste) and liste[i][0] <= t:
            entrees[liste[i][1]] = liste[i][2]
            i += 1
        if vm.etat['erreur']:
            print('erreur %d %d' % (vm.etat['erreur'], t))
            return
        if t >= fin:
            break
        suivant = prochain if prochain >= 0 else fin
        if i < len(liste) and liste[i][0] < suivant:
            suivant = liste[i][0]
        suivant = min(suivant, fin)
        if suivant <= t:
            suivant = t + 1
        maintenant[0] = suivant
    print('fin %d' % maintenant[0])

principal()
