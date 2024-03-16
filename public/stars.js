const section = document.getElementById('stars-container');
const numStars = 10;

for (let i = 0; i < numStars; i++) {
    const span = document.createElement('span');
    section.appendChild(span);
}