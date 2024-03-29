import FFI from 'ffi-napi';

const user32 = new FFI.Library('user32', {
  MessageBoxW: ['int', ['int', 'string', 'string', 'int']],
  PostMessageW: ['bool', ['int', 'int', 'uint', 'uint']]
});

const WM_CLOSE = 0x0010;
const MB_OK = 0x00000000;
const MB_ICONINFORMATION = 0x00000040;

const TEXT = text => Buffer.from(text + '\0', 'ucs2')

const ok = (title, message) => {
  const id = user32.MessageBoxW(
		null,
		TEXT(message),
		TEXT(title),
		MB_OK | MB_ICONINFORMATION
	);
};

const okCancel = (title, message) => {
  let response = user32.MessageBoxW(0, TEXT(message), TEXT(title), 1);
  return response == 1 ? 'OK' : 'CANCEL'
};

const abortRetryIgnore = (title, message) => {
  let response = user32.MessageBoxW(0, TEXT(message), TEXT(title), 2);
  return response == 3 ? 'ABORT' : response == 4 ? 'RETRY' : 'IGNORE'
};

export { ok, okCancel, abortRetryIgnore };