const SHEET_NAME = '査定依頼';
const HEADERS = ['受付日時','受付番号','対応状況','物件種別','都道府県','市区町村','町名・番地','土地面積','建物・専有面積','築年','間取り','売却希望時期','お名前','メールアドレス','電話番号'];
const PARTNER_SHEET_NAME = '業者問い合わせ';
const PARTNER_HEADERS = ['受付日時','受付番号','対応状況','会社名','担当者名','部署名','メールアドレス','電話番号','対応可能エリア','取扱物件','お問い合わせ内容','ご質問・ご要望'];

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ok:true,service:'Tsunageru不動産査定'})).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.formType === 'partnerInquiry') return savePartnerInquiry_(data);
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

function savePartnerInquiry_(data) {
  const required = ['companyName','contactName','email','phone','serviceArea','inquiryType'];
  if (required.some(k => !String(data[k] || '').trim())) throw new Error('必須項目が不足しています');
  if (String(data.website || '').trim()) return json_({ok:true,id:data.id});
  const types = Array.isArray(data.propertyTypes) ? data.propertyTypes.join('、') : String(data.propertyTypes || '');
  if (!types) throw new Error('取扱物件を選択してください');
  const sheet = getNamedSheet_(PARTNER_SHEET_NAME, PARTNER_HEADERS);
  sheet.appendRow([
    new Date(), safe_(data.id), '未対応', safe_(data.companyName), safe_(data.contactName),
    safe_(data.department), safe_(data.email), safe_(data.phone), safe_(data.serviceArea),
    safe_(types), safe_(data.inquiryType), safe_(data.message)
  ]);
  try {
    MailApp.sendEmail({
      to: 'info@zenkoku-satei.com',
      subject: '【業者問い合わせ】' + safe_(data.companyName) + '｜' + safe_(data.inquiryType),
      body: [
        '不動産会社様向けフォームからお問い合わせがありました。',
        '',
        '受付番号：' + safe_(data.id),
        '会社名：' + safe_(data.companyName),
        '担当者名：' + safe_(data.contactName),
        '部署名：' + safe_(data.department),
        'メール：' + safe_(data.email),
        '電話番号：' + safe_(data.phone),
        '対応可能エリア：' + safe_(data.serviceArea),
        '取扱物件：' + safe_(types),
        'お問い合わせ内容：' + safe_(data.inquiryType),
        'ご質問・ご要望：' + safe_(data.message)
      ].join('\n'),
      replyTo: safe_(data.email),
      name: '全国不動産査定ナビ'
    });
  } catch (notificationError) {
    console.error('Notification failed: ' + notificationError.message);
  }
  return json_({ok:true,id:data.id});
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

function getNamedSheet_(name, headers) {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty('SPREADSHEET_ID');
  let ss;
  if (id) {
    ss = SpreadsheetApp.openById(id);
  } else {
    ss = SpreadsheetApp.create('Tsunageru不動産査定_受付管理');
    props.setProperty('SPREADSHEET_ID', ss.getId());
  }
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1,1,1,headers.length).setValues([headers]).setFontWeight('bold').setBackground('#dcecff');
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
