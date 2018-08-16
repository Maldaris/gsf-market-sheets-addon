# Goonmetrics Google Sheets Addon

Polls market buy/sell orders from 1DQ1-A trade hub Keepstar for use in spreadsheets using [Goonmetrics API](https://goonmetrics.apps.goonswarm.org/).

## Usage

### Method

```javascript
    gsf_price_by_id(id, type, stationid)
```

### Arguments

* **id**(Number): Item ID
* **type**(String): "buy" or "sell"
* **stationid**(Number|Optional): Station ID. Defaults to `1022734985679`, the 1DQ1-A trade hub Keepstar.

### Examples

Get best Tritainum buy order in 1DQ1-A Keepstar

```javascript
    gsf_price_by_id('34', 'buy')
```

Get best Tritainum sell order in 1DQ1-A Keepstar

```javascript
    gsf_price_by_id('34', 'sell')
```

## Advanced Usage

You can use the underlying request & parser functions in your own scripts.

### Method

```javascript
    gsf_make_request(route, params, parser)
```

### Arguments

* **route**(URIComponent|String): API Route suffix for Goonmetrics (API spec [here](https://goonmetrics.apps.goonswarm.org/api/))
* **params**(Object): Object of query string kv pairs. Will be encoded at runtime.
* **parser**(Function): A parser factory instance created to extract the relevant output from the resulting XML document.

### Examples

```javascript
    gsf_make_request('price_data/',
        {station_id : 1022734985679, type_id : 34},
        parserFactory('goonmetrics/price_data/type:[id=34]/max', function(err, res){
            if(err) throw new Error(res);
            else return res;
        })
    );
```

__Note: The trailing `/` in the first argument is necessary per Goonmetrics API spec.__
__Note: The return value of `gsf_make_request` is the same as the parserFactory callback argument.__

### Method

```javascript
    parserFactory(spec, callback)
```

### Arguments

* **spec**(String): XML Path Specification string. Usage defined below.
* **callback**(Function): Callback function following [NodeJS callback convention](http://fredkschott.com/post/2014/03/understanding-error-first-callbacks-in-node-js/).

### XML Path Specification String

Extracting relevant information from XML documents requires walking the DOM Tree. Unlike JSON, XML nodes can contain attributes and nested nodes at the same time. This requires a solution for selecting the appropriate node as well as the intermediary nodes that contain the desired attributes.

In this case, the relevant attributes are usually Item IDs(`id`). We can specify the specific item ID we want using the following path spec:

`goonmetrics/price_data/type:[id=34]/`

If we wanted to search multiple type IDs at once, we can do so by deliminting the IDs by the `|` character.

`goonmetrics/price_data/type:[id=34|36|38]`

If we wanted to check for multiple attributes on the same node, we can do so by deliminting the name/value pairs with `,`.

`goonmetrics/price_data/type:[id=34,other=attribute]`

Note that in the above example, strings do not require quotation marks. The path string parser splits on symbols, namely `:`, `|`, and `,`.