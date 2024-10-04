// document.addEventListener('DOMContentLoaded', () => {
//     const keys = document.querySelectorAll('.key');

//     function pressKey(keyCode) {
//         const key = document.querySelector(`.key[data-key="${keyCode}"]`);
//         if (key) {
//             key.classList.add('pressed');
//             setTimeout(() => {
//                 key.classList.remove('pressed');
//             }, 100);
//         }
//     }

//     document.addEventListener('keydown', (event) => {
//         console.log(event.code)
//         pressKey(event.code);
//     });

//     keys.forEach(key => {
//         key.addEventListener('mousedown', () => {
//             const keyCode = key.getAttribute('data-key');
//             pressKey(keyCode);
//         });

//         key.addEventListener('touchstart', (e) => {
//             e.preventDefault(); 
//             const keyCode = key.getAttribute('data-key');
//             pressKey(keyCode);
//         });
//     });
// });