const SHEET_NAME = '査定依頼';
const HEADERS = ['受付日時','受付番号','対応状況','物件種別','都道府県','市区町村','町名・番地','土地面積','建物・専有面積','築年','間取り','売却希望時期','お名前','メールアドレス','電話番号'];

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ok:true,service:'Tsunageru不動産査定'})).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const required = ['propertyType','prefecture','city','address','name','email','phone'];
    if (required.some(k => !String(data[k] || '').trim())) throw new Error('必須項目が不足しています');
    const sheet = getSheet_();
    sheet.appendRow([
      new Date(), safe_(data.id), '未対応', safe_(data.propertyType), safe_(data.prefecture),
      safe_(data.city), safe_(data.address), safe_(data.landArea), safe_(data.buildingArea),
      safe_(data.builtYear), safe_(data.layout), safe_(data.timing), safe_(data.name),
      safe_(data.email), safe_(data.phone)
    ]);
    return json_({ok:true,id:data.id});
  } catch (err) {
    return json_({ok:false,message:err.message});
  }
}

function getSheet_() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty('SPREADSHEET_ID');
  let ss;
  if (id) {
    ss = SpreadsheetApp.openById(id);
  } else {
    ss = SpreadsheetApp.create('Tsunageru不動産査定_受付管理');
    props.setProperty('SPREADSHEET_ID', ss.getId());
  }
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1,1,1,HEADERS.length).setValues([HEADERS]).setFontWeight('bold').setBackground('#dcecff');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function safe_(value) {
  const s = String(value || '');
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
