A Simple spinner that can trigger any of the connected stream Elements

The segments config is a json object in the form:
```
{
  "label": string,
  "color": string,
  "weight": number,
  "multiplier": number,
  "dest": string, // the name of the connected element to trigger with this segment
  "msg": string // any message to send to a non spinner connected element
}
```