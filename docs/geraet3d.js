import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

const figur = document.querySelector('.geraet');
const ziel = figur && figur.querySelector('.geraet-3d');
if (ziel) start().catch(() => {});

async function bildLaden(src) {
  const b = new Image();
  b.decoding = 'async';
  b.src = src;
  await b.decode();
  return b;
}

async function start() {
  const probe = document.createElement('canvas');
  if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) return;

  const ruhig = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const quellen = ziel.dataset.bilder.split(',');
  const bilder = await Promise.all(quellen.map(bildLaden));

  const breite = () => ziel.clientWidth;
  const hoehe = () => Math.round(ziel.clientWidth * 0.5);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(breite(), hoehe());
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  ziel.appendChild(renderer.domElement);

  const etiketten = new CSS2DRenderer();
  etiketten.setSize(breite(), hoehe());
  etiketten.domElement.className = 'geraet-etiketten';
  ziel.appendChild(etiketten.domElement);

  const szene = new THREE.Scene();
  const kamera = new THREE.PerspectiveCamera(30, breite() / hoehe(), 1, 500);
  const abstand = () => (breite() < 520 ? 124 : 98);
  kamera.position.set(-6, -24, abstand());

  szene.add(new THREE.HemisphereLight(0xdfe6ee, 0x1c232d, 1.6));
  const licht = new THREE.DirectionalLight(0xffffff, 1.8);
  licht.position.set(-40, -30, 80);
  szene.add(licht);
  const kante = new THREE.DirectionalLight(0xf7931a, 0.6);
  kante.position.set(60, 40, -20);
  szene.add(kante);

  const geraet = new THREE.Group();
  szene.add(geraet);

  const mat = (farbe, rau = 0.6, metall = 0.1) => new THREE.MeshStandardMaterial({ color: farbe, roughness: rau, metalness: metall });

  const platine = new THREE.Mesh(new THREE.BoxGeometry(62, 26, 1.6), mat(0x0d1014, 0.7));
  geraet.add(platine);

  const modul = new THREE.Mesh(new THREE.BoxGeometry(53, 25, 3), mat(0x16191e, 0.35, 0.2));
  modul.position.set(4, 0, 2.3);
  geraet.add(modul);

  const glas = new THREE.Mesh(new THREE.BoxGeometry(50, 24, 0.4), mat(0x05070a, 0.08, 0.4));
  glas.position.set(3.2, 0, 3.95);
  geraet.add(glas);

  const leinwand = document.createElement('canvas');
  leinwand.width = 960;
  leinwand.height = 510;
  const ctx = leinwand.getContext('2d');
  const textur = new THREE.CanvasTexture(leinwand);
  textur.colorSpace = THREE.SRGBColorSpace;
  textur.anisotropy = 8;
  const schirm = new THREE.Mesh(new THREE.PlaneGeometry(43.2, 22.9), new THREE.MeshBasicMaterial({ map: textur, toneMapped: false }));
  schirm.position.set(4, 0, 4.17);
  geraet.add(schirm);

  const usb = new THREE.Mesh(new THREE.BoxGeometry(7.5, 9, 3.2), mat(0xb9c2cc, 0.25, 0.9));
  usb.position.set(-29.2, 0, 2.4);
  geraet.add(usb);
  const usbLoch = new THREE.Mesh(new THREE.BoxGeometry(0.6, 7.2, 1.8), mat(0x05070a, 0.9));
  usbLoch.position.set(-33, 0, 2.4);
  geraet.add(usbLoch);

  const etikett = (text, klasse) => {
    const e = document.createElement('div');
    e.className = 'etikett ' + klasse;
    e.textContent = text;
    return new CSS2DObject(e);
  };

  const tasten = [];
  const taste = (x, y, name, klasse) => {
    const g = new THREE.Group();
    const sockel = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.6, 1.6), mat(0xc4ccd5, 0.3, 0.8));
    const kappe = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 1, 24), mat(0x2a323d, 0.5));
    kappe.rotation.x = Math.PI / 2;
    kappe.position.z = 1.1;
    g.add(sockel, kappe);
    g.position.set(x, y, 1.6);
    const e = etikett(name, klasse);
    e.position.set(-15, y > 0 ? 1.5 : -1.5, 1.5);
    g.add(e);
    geraet.add(g);
    tasten.push(kappe);
    return kappe;
  };
  const btn1 = taste(-25.6, 8.6, ziel.dataset.btn1, 'btn1');
  taste(-25.6, -8.6, ziel.dataset.btn2, 'btn2');

  const rst = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.2, 1.4), mat(0x9aa3ad, 0.4, 0.6));
  rst.position.set(-19, 13.4, 0.6);
  geraet.add(rst);

  const steuerung = new OrbitControls(kamera, renderer.domElement);
  steuerung.enableZoom = false;
  steuerung.enablePan = false;
  steuerung.enableDamping = true;
  steuerung.minPolarAngle = Math.PI * 0.18;
  steuerung.maxPolarAngle = Math.PI * 0.82;
  steuerung.minAzimuthAngle = -Math.PI * 0.6;
  steuerung.maxAzimuthAngle = Math.PI * 0.6;
  steuerung.target.set(-6, 0, 2);
  renderer.domElement.addEventListener('pointerdown', () => { benutzt = true; });

  let benutzt = false;
  let bildNr = 0;
  let zuletzt = -1;
  const zeichne = (nr) => {
    ctx.drawImage(bilder[nr], 0, 0, leinwand.width, leinwand.height);
    textur.needsUpdate = true;
  };
  zeichne(0);

  const groesse = () => {
    renderer.setSize(breite(), hoehe());
    etiketten.setSize(breite(), hoehe());
    kamera.aspect = breite() / hoehe();
    kamera.position.setLength(Math.hypot(6, 24, abstand()));
    kamera.updateProjectionMatrix();
  };
  new ResizeObserver(groesse).observe(ziel);

  figur.classList.add('mit-3d');
  const uhr = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const t = uhr.getElapsedTime();
    if (!ruhig) {
      const nr = Math.floor(t / 4) % bilder.length;
      if (nr !== zuletzt) {
        zuletzt = nr;
        bildNr = nr;
        zeichne(bildNr);
      }
      const beleg = quellen[bildNr].includes('4a-');
      const druck = beleg && t % 4 > 2.2 && t % 4 < 3.2;
      btn1.position.z = druck ? 0.75 : 1.1;
      btn1.material.color.setHex(druck ? 0xf7931a : 0x2a323d);
      if (!benutzt) geraet.rotation.y = Math.sin(t * 0.35) * 0.26;
    }
    steuerung.update();
    renderer.render(szene, kamera);
    etiketten.render(szene, kamera);
  });
}
