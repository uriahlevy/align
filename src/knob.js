const knob = document.querySelector('input-knob');

const initValue = Number.parseFloat(knob.value).toFixed(3);

function logEvent(evt) {
    const curValue = Number.parseFloat(knob.value).toFixed(3);
    // console.log(curValue)
}

document.addEventListener('knob-move-change', logEvent);