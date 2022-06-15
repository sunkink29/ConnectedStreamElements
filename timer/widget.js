var fields;
var isEditor = false;
var countDownTimer = Date.now();
var maxEndDate = Date.now();
var lastEventTime = 0;

function onWidgetLoad(obj) {
  fields = obj.detail.fieldData;
  const { max_duration } = fields;

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

  //This section sets all the text. So then in the repeating function, I only need to show/hide, rather than re-setting the p values
  const subText = "Subs add " + fields.sub_time.toString() + " minutes to the stream";
  const bitText = "Each " + fields.bit_minimum.toString() + " bits will add " + fields.bit_time.toString() + " minutes to the stream";
  const tipText = "Each " + fields.tip_currency + fields.tip_minimum.toString() + " donation will add " + fields.tip_time.toString() + " minutes to the stream";
  if (max_duration > 0) {
    maxText = "The stream will last a maximum of " + max_duration.toString() + " hours";
  }

  DOM.setText("#SubsText", subText);
  DOM.setText("#BitsText", bitText);
  DOM.setText("#TipsText", tipText);
  DOM.setText("#MaxText", maxText);
  DOM.find("#infoPanel").hidden = true;

  DOM.find('#event').hidden = true;
  DOM.find('.eventContainer').hidden = true;
  if (fields.show_info) {
    setInterval(function () {
      //Here we will show the panel, delay then hide the panel. 
      //$('#infoPanel').show().delay(info_duration).hide();
      DOM.find('#infoPanel').hidden = false;
      setTimeout(function () {
        DOM.find('#infoPanel').hidden = true;
      }, fields.info_duration * 1000)
    }, fields.info_interval * 60000);
  }
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
  var newTime = countDownTimer + (minToAdd * 60000);
  //logic to check to see if the time added would take the stream over the maximun set
  if ((newTime > maxEndDate) && (fields.max_duration > 0)) {
    countDownTimer = maxEndDate;
  }
  else {
    countDownTimer = countDownTimer + (minToAdd * 60000);
  }
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
}

function resetTimer() {
  let curTime = Date.now();
  maxEndDate = curTime + (fields.max_duration * 1000 * 60 * 60);
  countDownTimer = curTime + (fields.initial_duration * 1000 * 60 * 60);
}