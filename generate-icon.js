// Génère une icône PNG simple en Base64 encodée directement dans les données
const fs = require('fs');

// Icône 48x48 - format PNG avec fond violet visible
// Cette icône a un fond coloré opaque (pas transparent)
const icon48Base64 = `iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QA/wD/AP+gvaeTAAAAB3RJTUUH5wEICBQiGGZ8mAAABORJREFUaN7tmV1oHFUUx3/nzuxmd5Mm26RJ0zaptU21VqtVqVLwQR+qPoh9UKSIUhBBEPRBfRB98UEERX0QH4oP+qAPCr5YBcUWP6pYLVYr1Y9W+0GbNE2abZrNbjY7O3Pv8WF2k92dmd3ZbGKhc2CYmXvPPef+59x77pkL/+ci/N8FWKnIxXxZ1VLVALqBTqAVaARqgRqgCigDBeAKcBGYAM4DI0qp8f8FAMB1gF3AG8AeoA9oBlQFBqvAGDAEfAF8rpSaXjUA4HbgaeAVoAtQS/jUgAngV+AcMAFMAUWgBGigEWgB1gF3Ag8Bj2MlZKUyDxwAPlJK/bXsAADeCjwKvArcDVgVGJsFRoGfgZ+An5RS4wvYbMBKQB/wIPA4sAOwK7D/FngReE8pVaxIZADgNuBp4A2geREDc1jdYxD4FilpFygBaVwvTywkyRJFqkgSLULzIr6vAG8BHyqlphYVALgTeAl4DqgO/XqAS8C3wDfAT0qpiUoAhBDCMIxq2y5bZyd2J2uyMaeuIdRiZc1hVZe3gXeVUpnQAABN+Mz3NPBciGdm3ewJYBC4DDQAPcDdwF3ADcAdwHq8LnVl6feTvG7dgqsC6jX+eCBs0nB5FPgQ+EIplQoFAFwLPAO8jteNglIEfgNOYnWdIaAmxD9gVX0d8ABwD3AjMO//9gPw+wrZqwNvAR8opa75AQBCCANYT/wlrNO/vzRgVe1HYAg4H3LqhpUaYD3WuB8A7sNKNFjVfgPrWDzpax+1txN4A/hQKZXdAYDI4lcX+tV+p0mgC1iH1Q0agRTe8a8Bm7CquxPYDNwC3I419sOkBJzBmr4/AWeVUpMVcMkBx5VST0SI7ADmgS+xHv0pcGDGJYVVjUREnX6A+YpQb6Aa+FsptTXAXoH/fVgCnEJEDgBzQB+e+QrgCrAF2IpV8V1Aw0J+nSWIg5d82Uqb+5hX68xKpO4HHsE7zYNyDigFNpRYQlwG2rBGdQtwK9AC1C/C/nXgCSHETqXUz5H+VXpg0bItUSo+l2tC5h3cAezBO+kT/t+uwAZACLEOb+wfBB7BmvZbsJIZRRaBHqXUReCo1trx/xHVAABYFW5YhJ0kVuVblFJXIwI+hTdlJq+K/yWldFxRfSUILKW+X4g/uRhANPIkTdNo4+e4iSPaOM5+YwW00w6Hv1crgDYOwzB0r911S9C/1vcrvWvYOI5j+/nTWmvX15DWOuP/7vgBtNY59z9aa+3/77juTBBn0FfWda/FsVZK5cI+sEuQWqwrrBS48A8kVgjsVZIi1lWXUso2TNViaWevtrA3Y88opVKxlWgAtNa/Al8Dx0XEAkBpM8+0M0qByRWBsK9zMk8xk4nk5mfgJeBzEemOBOHbPYG14k/ghP8r6aT+Y+okM0xRSGcoZdLxW3EfvMeOA/3AJ8D9EXx9SqkfI/m+qkd0A1bjWY/HJSkk0+iTU0wzyQQXmCJFjirqaaGLTvbQRYcoXsE6En8Hjmmtx8IAVCgH2JrgD1A68d5SqOE2ttBN19V/KhRonvlQSUvY4z+gZIa/mWGCKf5klrPMc5pZ5jjALc4rWI8a8cAtVkrH/M12sF5d1GCN1w6sda4f650mzvuDFX3I+L+I/A21rQfCmXX0hgAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyMy0wMS0wOFQwODoyMDozNCswMDowMCJiQCkAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjMtMDEtMDhUMDg6MjA6MzQrMDA6MDBTPfiaAAAAAElFTkSuQmCC`;

// Écrire l'icône
const iconBuffer = Buffer.from(icon48Base64, 'base64');
fs.writeFileSync('icons/icon-48.png', iconBuffer);
fs.writeFileSync('icons/icon-96.png', iconBuffer); // Même icône pour 96x96

console.log('✅ Icônes générées avec succès !');
console.log('   icons/icon-48.png');
console.log('   icons/icon-96.png');
console.log('');
console.log('Prochaines étapes :');
console.log('1. Rechargez l\'extension dans Firefox');
console.log('2. L\'icône devrait maintenant être visible !');
