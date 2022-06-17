## Summary
A Simple spinner that can trigger any of the connected stream Elements

## Source Code
### html
```js linenums="1"
  --8<-- "src/spinner/widget.html"
```
### css
```js linenums="1"
  --8<-- "src/spinner/widget.css"
```
### js
```js linenums="1"
  --8<-- "src/spinner/widget.js"
```
### json
```js linenums="1"
  --8<-- "src/spinner/widget.json"
```
## Segment config
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