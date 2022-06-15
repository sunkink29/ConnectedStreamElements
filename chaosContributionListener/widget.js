let fields;
let isEditor = false;
const eventQueue = [];
let lastEventTime = 0;

function onWidgetLoad(obj) {
  fields = obj.detail.fieldData;
  const { max_duration } = fields;

  SE_API.getOverlayStatus().then((value) => isEditor = value.isEditorMode);

  //This section sets all the text. So then in the repeating function, I only need to show/hide, rather than re-setting the p values
  const subText = "Subs add " + fields.sub_time.toString() + " minutes to the stream";
  const bitText = "Each " + fields.bit_minimum.toString() + " bits will add " + fields.bit_time.toString() + " minutes to the stream";
  const tipText = "Each " + fields.tip_currency + fields.tip_minimum.toString() + " donation will add " + fields.tip_time.toString() + " minutes to the stream";
  let maxText = '';
  if (max_duration > 0) {
    maxText = "The stream will last a maximum of " + max_duration.toString() + " hours";
  }

  DOM.setText("#SubsText", subText);
  DOM.setText("#BitsText", bitText);
  DOM.setText("#TipsText", tipText);
  DOM.setText("#MaxText", maxText);
  DOM.find("#infoPanel").hidden = true;

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
  if (data.field === 'reload' && isEditor) {
    document.location.href = document.location.href;
  }
}

function onKVStoreUpdate(data) {
  const value = data.value
  const isEventMsg = data.key === 'customWidget.timeAdded';
  const isEditorMatch = value.isEditor === isEditor
  const newEvent = value.curTime > lastEventTime;

  if (isEventMsg && isEditorMatch && newEvent) {
    lastEventTime = value.curTime;
    startNextQueuedEvent();
  }
}

function onSubBomb(data) {
  const bulkAmount = data.amount;
  if (bulkAmount % 5 == 0) {
    addEventToQueue(() => sendEvent(data.sender, 'subbed', fields.sub_time * bulkAmount, bulkAmount, true));
  }
  else if (bulkAmount % 2 == 0) {
    addEventToQueue(() => sendEvent(data.sender, 'subbed', -1 * fields.sub_time * bulkAmount, bulkAmount));
    return;
  }
  else {
    addEventToQueue(() => sendEvent(data.sender, 'subbed', fields.sub_time * bulkAmount, bulkAmount));
    return;
  }
}

function onSubscriber(data) {
  addEventToQueue(() => sendEvent(data.sender, 'subbed', fields.sub_time));
}

function onResub(data) {
  addEventToQueue(() => sendEvent(data.sender, 'subbed', fields.sub_time));
}

function onSubGift(data) {
  addEventToQueue(() => sendEvent(data.sender, 'subbed', fields.sub_time));
}

function onCheer(data) {
  const amount = data.amount;
  if (amount >= fields.bit_minimum) {
    if (data.message.toLowerCase().includes("!spin")) {
      addEventToQueue(() => sendEvent(data.sender, 'cheered', Math.floor(amount / fields.bit_minimum) * fields.bit_time, amount, true));
    } else {
      addEventToQueue(() => sendEvent(data.sender, 'cheered', Math.floor(amount / fields.bit_minimum) * fields.bit_time, amount));
    }
  }
}

function onTip(data) {
  const amount = data.amount;
  if (amount >= fields.tip_minimum) {
    if (data.message.toLowerCase().includes("!spin")) {
      addEventToQueue(() => sendEvent(data.sender, 'tipped', Math.floor(amount / fields.tip_minimum) * fields.tip_time, amount, true));
    } else {
      addEventToQueue(() => sendEvent(data.sender, 'tipped', Math.floor(amount / fields.tip_minimum) * fields.tip_time, amount));
    }
  }
}

function sendEvent(name, type, num, amount, spinWheel) {
  const event = (dest) => {
    SE_API.store.set('eventMessage', {
      dest: dest,
      data: { name, type, num, amount },
      curTime: Date.now(),
      isEditor,
    });
  };
  if (spinWheel) {
    event(fields.wheelName);
  } else {
    event(fields.timerName);
  }
}

function addEventToQueue(event) {
  if (eventQueue.length == 0) {
    event();
  }
  eventQueue.push(event);
}

function startNextQueuedEvent() {
  eventQueue.shift();       // clears the last running event
  if (eventQueue.length > 0) {
    eventQueue[0]();
  }
}