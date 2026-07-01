// Root bypass for ome.tv's virtual-camera detection.
//
// ome.tv's whole check is client-side and funnels through one global object, `window.FCN`:
//
//   FCN.isValid(label)      -> false when the device label matches ~75 virtual-cam names / regexes
//                              (OBS Virtual Camera, DroidCam, Manycam, "contains Virtual", ...)
//   FCN.isSuspicious(label) -> extra flag for weaker patterns (all-lowercase, single char, ...)
//
// Each enumerated device becomes `new MediaDevice(d)` whose `.isValid` / `.isSuspicious` are computed
// from its label via FCN; the app then filters out anything invalid and errors with "you denied
// access to your devices". Labels are NEVER sent to the server (WebRTC doesn't transmit track
// labels, and FCN just throws locally), so neutralizing FCN lets the *real* device names through,
// with no renaming and no spoofed enumerateDevices.
//
// FCN is assigned once, after our document-start hook runs, via `window.FCN = <fn>`. We install an
// accessor on `window.FCN` up front so we can rewrite its two methods the instant ome.tv defines it
// (and again if it's ever reassigned on SPA navigation).

const DEBUG = false;
const log = (...a) => DEBUG && console.log('[OmeTV Unblock]', ...a);

const alwaysValid = () => true;
const neverSuspicious = () => false;

// Replace FCN's verdict methods so every device, whatever its real label, passes.
function neutralize(fcn) {
  if (!fcn || (typeof fcn !== 'function' && typeof fcn !== 'object')) return fcn;
  if (fcn.__omeUnblocked) return fcn;
  try {
    Object.defineProperty(fcn, 'isValid', {
      configurable: true,
      enumerable: false,
      writable: true,
      value: alwaysValid,
    });
    Object.defineProperty(fcn, 'isSuspicious', {
      configurable: true,
      enumerable: false,
      writable: true,
      value: neverSuspicious,
    });
    Object.defineProperty(fcn, '__omeUnblocked', {
      value: true,
      configurable: true,
    });
    log('FCN neutralized');
  } catch (e) {
    // Fall back to plain assignment if the methods aren't configurable.
    try {
      fcn.isValid = alwaysValid;
      fcn.isSuspicious = neverSuspicious;
    } catch (e2) {}
  }
  return fcn;
}

// ManyCam is the one virtual cam FCN can't cover: ome.tv has a separate hard-coded client throw,
// `M(label)`, that fires when a *track* label contains "manycam". M is a private closure, so the only
// lever is the track-label string it reads. We override MediaStreamTrack.prototype.label to strip
// "manycam", but only for labels that actually contain it, leaving every other device untouched. The
// device picker reads MediaDeviceInfo (enumerateDevices), not track labels, so the real "ManyCam …"
// name still shows in the dropdown; only the internal string M inspects is sanitized. Living on the
// track prototype, this also survives ome.tv swapping out navigator.mediaDevices.
function patchManyCamLabel() {
  const proto = window.MediaStreamTrack && window.MediaStreamTrack.prototype;
  if (!proto) return;
  const desc = Object.getOwnPropertyDescriptor(proto, 'label');
  if (!desc || !desc.get || desc.get.__omeManyCam || !desc.configurable) return;
  const realGet = desc.get;
  const get = function () {
    const label = realGet.call(this);
    return typeof label === 'string' && /manycam/i.test(label)
      ? label.replace(/manycam/gi, 'Camera')
      : label;
  };
  get.__omeManyCam = true;
  Object.defineProperty(proto, 'label', { ...desc, get });
  log('ManyCam track-label sanitizer installed');
}

export function installShim() {
  patchManyCamLabel();

  // If FCN is somehow already present (e.g. hot reload after the app booted), patch it now.
  if (window.FCN) neutralize(window.FCN);

  // Intercept the assignment `window.FCN = ...` so we win regardless of load order.
  let current = window.FCN;
  try {
    Object.defineProperty(window, 'FCN', {
      configurable: true,
      get() {
        return current;
      },
      set(v) {
        current = neutralize(v);
      },
    });
    log('FCN interceptor installed at document-start');
  } catch (e) {
    // Property not redefinable, retry neutralizing on a short poll until FCN appears.
    let tries = 0;
    const id = setInterval(() => {
      if (window.FCN) {
        neutralize(window.FCN);
        clearInterval(id);
      } else if (++tries > 200) {
        clearInterval(id);
      }
    }, 50);
  }
}
