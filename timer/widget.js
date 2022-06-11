var fields;
var sub_time = 0;
var bit_amt = 0;
var bit_time = 0;
var tip_amt = 0;
var tip_time = 0;
var tip_currency = "$";
var countDownTimer = new Date().getTime();
var initial_duration = 0;
var max_duration = 0;
var maxEndDate = new Date().getTime();
var show_info = false;
var info_interval = 0;
var info_duration = 0;
var isBulkGifted = false;
var bulkAmount = 0;

window.addEventListener('onWidgetLoad', function (obj) {
  fields = obj.detail.fieldData;
  let { sub_time, bit_time, tip_time, tip_currency } = fields;
  initial_duration = fields.initial_duration;
  max_duration = fields.max_duration;
  show_info = fields.show_info;
  info_interval = fields.info_interval;
  info_duration = fields.info_duration;
  bit_amt = fields.bit_minimum;
  tip_amt = fields.tip_minimum;

  //This is the maximum end time for the stream. We need to use this when we add time
  //to ensure we don't exceed this. 
  maxEndDate = maxEndDate + (max_duration * 1000 * 60 * 60);
  countDownTimer = new Date().getTime();
  countDownTimer = countDownTimer + (initial_duration * 1000 * 60 * 60);
  SE_API.store.get('curTime').then(obj => {
    if (obj.value) {
      countDownTimer = obj.value
    }
  });

  //This section sets all the text. So then in the repeating function, I only need to show/hide, rather than re-setting the p values
  const subText = "Subs add " + sub_time.toString() + " minutes to the stream";
  const bitText = "Each " + bit_amt.toString() + " bits will add " + bit_time.toString() + " minutes to the stream";
  const tipText = "Each " + tip_currency + tip_amt.toString() + " donation will add " + tip_time.toString() + " minutes to the stream";
  if (max_duration > 0) {
    maxText = "The stream will last a maximum of " + max_duration.toString() + " hours";
  }

  $('#SubsText').text(subText);
  $('#BitsText').text(bitText);
  $('#TipsText').text(tipText);
  $('#MaxText').text(maxText);
  $('#infoPanel').hide();


  var x = setInterval(function () {
    var now = new Date().getTime();
    var diff = countDownTimer - now;
    var days = Math.floor(diff / (1000 * 60 * 60 * 24));
    var hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((diff % (1000 * 60)) / 1000);
    document.getElementById('countdown').innerHTML = days + "d " + hours + "h " + minutes + "m " + seconds + "s";
  }, 1000);

  $('#event').hide();
  $('.eventContainer').hide();
  info_interval = info_interval * 60000;
  info_duration = info_duration * 1000;
  if (show_info) {
    var y = setInterval(function () {
      //Here we will show the panel, delay then hide the panel. 
      //$('#infoPanel').show().delay(info_duration).hide();
      $('#infoPanel').show("fast").delay(info_duration).hide("fast");
    }, info_interval);
  }
});

//** UPDATE INFO WIDGET INFORMATION
window.addEventListener('onEventReceived', function (obj) {
  const listener = obj.detail.listener;
  const event = obj["detail"]["event"];

  if (event.listener === 'widget-button') {
    if (event.field === 'reset_time') {
      countDownTimer = new Date().getTime();
      countDownTimer = countDownTimer + (initial_duration * 1000 * 60 * 60);
    } else if (event.field === 'store_time') {
      SE_API.store.set('curTime', countDownTimer);
    }
  }
});

function addTimeToCounter(minToAdd, event, type) {
  var newTime = countDownTimer + (minToAdd * 60000);
  //logic to check to see if the time added would take the stream over the maximun set
  if ((newTime > maxEndDate) && (max_duration > 0)) {
    countDownTimer = maxEndDate;
  }
  else {
    countDownTimer = countDownTimer + (minToAdd * 60000);
  }
  SE_API.store.set('curTime', countDownTimer);

  console.log(event)

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