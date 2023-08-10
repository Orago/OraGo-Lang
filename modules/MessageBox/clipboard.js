import ffi from 'ffi-napi';
import ref from 'ref-napi';

const user32 = new ffi.Library('user32', {
  OpenClipboard: ['bool', ['pointer']],
  EmptyClipboard: ['bool', []],
  GetClipboardData: ['pointer', ['uint']],
  SetClipboardData: ['pointer', ['uint', 'pointer']],
  CloseClipboard: ['bool', []],
  GlobalAlloc: ['pointer', ['uint', 'size_t']],
  GlobalLock: ['pointer', ['pointer']],
  GlobalUnlock: ['bool', ['pointer']],
  CF_UNICODETEXT: 13,
  GMEM_MOVEABLE: 0x0002,
  GMEM_ZEROINIT: 0x0040
});

function setClipboardText(text) {
  const hMem = user32.GlobalAlloc(user32.GMEM_MOVEABLE | user32.GMEM_ZEROINIT, Buffer.byteLength(text, 'ucs2') + 2);
  if (hMem.isNull()) {
    throw new Error('Failed to allocate memory for clipboard data.');
  }

  const pMem = user32.GlobalLock(hMem);
  if (pMem.isNull()) {
    user32.GlobalFree(hMem);
    throw new Error('Failed to lock memory for clipboard data.');
  }

  pMem.writeU16LE(0, text, 0, text.length);
  user32.GlobalUnlock(hMem);

  if (!user32.OpenClipboard(null)) {
    throw new Error('Failed to open clipboard.');
  }

  user32.EmptyClipboard();
  user32.SetClipboardData(user32.CF_UNICODETEXT, hMem);

  user32.CloseClipboard();
}

function getClipboardText() {
  if (!user32.OpenClipboard(null)) {
    throw new Error('Failed to open clipboard.');
  }

  const hMem = user32.GetClipboardData(user32.CF_UNICODETEXT);
  if (hMem.isNull()) {
    user32.CloseClipboard();
    throw new Error('No clipboard data available.');
  }

  const pMem = user32.GlobalLock(hMem);
  if (pMem.isNull()) {
    user32.CloseClipboard();
    throw new Error('Failed to lock memory for clipboard data.');
  }

  const text = pMem.toString('ucs2', 0, pMem.length);
  user32.GlobalUnlock(hMem);

  user32.CloseClipboard();

  return text;
}

export { setClipboardText, getClipboardText };