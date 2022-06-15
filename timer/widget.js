let fields;
let isEditor = false;
let countDownTimer = Date.now();
let maxEndDate = Date.now();
let lastEventTime = 0;

function onWidgetLoad(obj) {
  fields = obj.detail.fieldData;

  SE_API.getOverlayStatus().then((value) => isEditor = value.isEditorMode);

  resetTimer();
  SE_API.store.get('curTime').then(obj => {
    if (obj.value) {
      countDownTimer = obj.value
    }
  });

  var x = setInterval(function () {
    var now = new Date().getTime();
    var diff = countDownTimer - now;
    var days = Math.floor(diff / (1000 * 60 * 60 * 24));
    var hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((diff % (1000 * 60)) / 1000);
    document.getElementById('countdown').innerHTML = days + "d " + hours + "h " + minutes + "m " + seconds + "s";
  }, 1000);

  DOM.find('#event').hidden = true;
  DOM.find('.eventContainer').hidden = true;
}

function onWidgetButton(data) {
  if (data.field === 'reset_time') {
    resetTimer();
  } else if (data.field === 'store_time') {
    SE_API.store.set('curTime', countDownTimer);
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

  if (isEventMsg && nameMatch && isEditorMatch && newEvent) {
    lastEventTime = value.curTime;
    addTimeToCounter(value.data.num, value.data, value.data.type);
  }
}

function addTimeToCounter(minToAdd, event, type) {
  countDownTimer = countDownTimer + (minToAdd * 60000);
  if (!isEditor) {
    SE_API.store.set('curTime', countDownTimer);
  }

  var eventMsg = event["name"] + " " + type;
  var amountString = "";
  var minuteString = minToAdd.toString();
  if (type == "subbed") {
    if (minuteString < 0) {
      minuteString = minuteString.split("-")[1]
      eventMsg = `${eventMsg} removing ${minuteString} minutes from the timer`;
    } else {
      eventMsg = `${eventMsg} adding ${minuteString} minutes to the timer`;
    }
  }
  else if (type == "cheered") {
    amountString = event["amount"].toString();
    if (minuteString < 0) {
      minuteString = minuteString.split("-")[1]
      eventMsg = `${eventMsg} ${amountString} removing ${minuteString} minutes from the timer`;
    } else {
      eventMsg = `${eventMsg} ${amountString} adding ${minuteString} minutes to the timer`;
    }
  }
  else {
    amountString = event["amount"].toString();
    if (minuteString < 0) {
      minuteString = minuteString.split("-")[1]
      eventMsg = `${eventMsg} ${tip_currency + amountString} removing ${minuteString} minutes from the timer`;

    } else {
      eventMsg = `${eventMsg} ${tip_currency + amountString} adding ${minuteString} minutes to the timer`;
    }

  }
  document.getElementById('event').innerHTML = eventMsg;
  $('.eventContainer').show().animate({ height: "50px" });
  $('#event').show();
  setTimeout(function () {
    clearEvent();
  }, 3000);
}

function clearEvent() {
  $('.eventContainer').animate({ height: "0px" }).hide();
  $('#event').hide();
  SE_API.store.set('timeAdded', {
    curTime: Date.now(),
    isEditor,
  });
}

function resetTimer() {
  countDownTimer = Date.now() + (fields.initial_duration * 1000 * 60 * 60);
}