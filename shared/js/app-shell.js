export function setYear() {
  document.querySelectorAll('[data-current-year]').forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });
}

export function setVersion(version = 'v1.0.0-foundation') {
  document.querySelectorAll('[data-app-version]').forEach((node) => {
    node.textContent = version;
  });
}

setYear();
setVersion();
