/** @constant {JSON} */
const options = {
  "Accept-Language": "en",
  "Accept-Encoding": "gzip, deflate, br",
  "Content-Type": "text/csv",
  "Connection": "keep-alive",
};

const arr_currency = ["", "USD", "EUR", "GBP", "CNY", "JPY"];

var list_addresses = [];

/** 
* Merge statements
* @param {String} accounts - list of tezos address separated by comma (,)
* @param {Date} dt_from - Statement period from.
* @param {Date} dt_to - Statement period to.
* @param {String} currency - The options are USD, EUR, GBP, CNY, JPY
* @return {Array} .csv file converted to array.
*/
function get_statements(accounts, dt_from, dt_to, currency = "USD") {
  let arr_accounts = accounts.split(",");
  let full_data = Array();
  for (k in arr_accounts) {
    let data = get_statement(arr_accounts[k], dt_from, dt_to, currency);
    if (full_data.length == 0) {
      full_data = data;
    } else {
      data.shift();
      full_data = full_data.concat(data);
    }
  }
  return full_data.sort((a, b) => b[0] - a[0]);
}

/** 
* Get que statement csv file from https://tzkt.io and convert in array
* @param {String} account - tezo address
* @param {Date} dt_from - Statement period from.
* @param {Date} dt_to - Statement period to.
* @param {String} currency - The options are USD, EUR, GBP, CNY, JPY
* @return {Array} .csv file converted to array.
*/
function get_statement(account, dt_from, dt_to, currency) {
  currency = "USD";
  const date_from = new Date(dt_from);
  const date_to = new Date(dt_to);

  let url =
    "https://back.tzkt.io/v1/accounts/" +
    account +
    "/report?from=" +
    date_from.toLocaleString("sv-SE", { timeZone: "UTC" }) +
    "&to=" +
    date_to.toLocaleString("sv-SE", { timeZone: "UTC" }) +
    "&currency=" +
    currency.toLowerCase() + 
    "&historical=true&delimiter=semicolon&separator=point";

  let response = UrlFetchApp.fetch(url, options);
  let content_text = response.getContentText();

  let data = content_text
    .trim()
    .split("\n")
    .map((v) => v.split(";"));

  for (let k in data) {
    if (k != 0) {
      for (kk in data[k]) {
        data[k][kk] = format_data(data[k][kk], kk);
      }
    }
  }
  return data;
}

/** 
* Get quote of the day
* @param {String} currency - The options are USD, EUR, GBP, CNY, JPY
* @return {Float} Value in the currency informed
*/
function get_quote(currency = "USD") {
  let i = "quote" + currency.charAt(0).toUpperCase() + currency.slice(1).toLowerCase();
  let url = "https://back.tzkt.io/v1/head";

  let response = UrlFetchApp.fetch(url, options);
  let content = JSON.parse(response.getContentText());
  return content[i];
}

/** 
* Format some collumns from the CSV/Array
* @summary Date to date and tezos and dolar to float
* @param {String} data - Value to format
* @param {String} i - Index from CSV/Array
* @return {Mixed} Value formated
*/
function format_data(data, i) {
  let i_float = ["3", "4", "6", "7", "8", "9"];
  let i_address = ["5","10"]
  if (data == "") {
    return data;
  } else if (i == 1) {
    r = new Date(data);
  } else if (i_address.includes(i)) {
    r = get_user(data);
  } else if (i_float.includes(i)) {
    if (data == "") {
      r = data;
    } else {
      r = parseFloat(data);
    }
  } else {
    r = data;
  }
  return r;
}

function get_user(address){
  if(address in list_addresses == false){
    let url = "https://back.tzkt.io/v1/accounts/"+address+"?metadata=true";
    let response = UrlFetchApp.fetch(url, options);
    let content = JSON.parse(response.getContentText());
    if ("alias" in content){
      list_addresses[address] = content.alias;
    }else{
      list_addresses[address] = address
    }
  }
  return list_addresses[address];
}

function get_price(currency="USD"){
  let url = "https://stats.dipdup.net/v1/histogram/prices/avg/month?field=Price&Currency="+arr_currency.indexOf("USD");+"&size=1000";
  let response = UrlFetchApp.fetch(url, options);
  let content = JSON.parse(response.getContentText());
  let data = Array();
  for(let k in content){
    let row = Array();
    row.push(
      new Date(content[k]["ts"]*1000),
      content[k]["value"]
    );
    data.push(row);
  }
  return data;
}
