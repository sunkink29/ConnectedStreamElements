let fields;
let isEditor = false;
let wheel;
let segments;
let wheelSpinning = false
let curData = { num: 1, type: 'subbed', name: 'test User', amount: 1 }
let lastEventTime = 0;

function onWidgetLoad(obj) {
  fields = obj.detail.fieldData;
  segments = JSON.parse(fields.segmentConfig);

  SE_API.getOverlayStatus().then((value) => isEditor = value.isEditorMode);

  let sumWeights = 0;
  const weights = segments.map(segment => segment.weight).filter(s => s);
  if (segments && weights) {
    sumWeights = weights.reduce((sum, weight) => sum + weight, 0);
  }

  const displaySegments = segments.map(segment => ({
    text: segment.label,
    fillStyle: segment.color ?? random_hex_color_code(),
    size: segment.weight ? 360 * segment.weight / sumWeights : undefined
  }))
  wheel = new Winwheel({
    drawMode: fields.displayImage ?? 'image',
    outerRadius: fields.wheelSize / 2,      // Set outer radius so wheel fits inside the background.
    innerRadius: fields.innerRadius,        // Make wheel hollow so segments don't go all way to center.
    textFontSize: fields.textSize,          // Set default font size for the segments.
    textOrientation: 'vertical',                  // Make text vertial so goes down from the outside of wheel.
    textAlignment: 'outer',                       // Align text to outside of wheel.
    numSegments: segments.length,                 // Specify number of segments.
    segments: displaySegments,                           // Define segments including colour and text.
    pins: {
      number: fields.pins,
    },
    animation: {                                  // Specify the animation to use.
      type: 'spinToStop',
      duration: fields.duration,                         // Duration in seconds.
      spins: fields.spins,                                // Default number of complete spins.
      callbackFinished: 'onWheelStop()'
    }
  });
  let loadedImg = new Image();
  loadedImg.src = fields.wheelImage;
  loadedImg.onload = function () {
    wheel.wheelImage = loadedImg;              // Make wheelImage equal the loaded image object.
    wheel.draw();                              // Also call draw function to render the wheel.
  };
}

function onWidgetButton(data) {
  if (data.field === 'spinButton') {
    wheel.rotationAngle = 0;
    // wheel.stopAnimation(false);
    // wheel.startAnimation();
    // wheelSpinning = true;
  } else if (data.field === 'reload' && isEditor) {
    document.location.href = document.location.href;
  }
}

function onKVStoreUpdate(data) {
  const value = data.value
  const isEventMsg = data.key === 'customWidget.eventMessage';
  const nameMatch = value.dest === fields.name;
  const isEditorMatch = value.isEditor === isEditor
  const newEvent = value.curTime > lastEventTime;

  if (isEventMsg && nameMatch && isEditorMatch && newEvent && !wheelSpinning) {
    lastEventTime = value.curTime;
    curData = value.data;
    wheel.rotationAngle = 0;
    wheel.stopAnimation(false);
    wheel.startAnimation();
    wheelSpinning = true;
  }
}

function onWheelStop() {
  wheelSpinning = false;
  const segment = segments[wheel.getIndicatedSegmentNumber() - 1];
  if (segment.dest) {
    SE_API.store.set('eventMessage', {
      dest: segment.dest,
      msg: segment.msg,
      data: { ...curData, num: curData.num * segment.multiplier },
      curTime: Date.now(),
      isEditor,
    });
  }
}

const random_hex_color_code = () => {
  let n = (Math.random() * 0xfffff * 1000000).toString(16);
  return '#' + n.slice(0, 6);
};