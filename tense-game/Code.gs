// Google Sheet-এর প্রথম tab-এর নাম: Results
const HEAD = ['DateTime','PlayerName','Mode','Language','TotalQuestions','Score','Percentage','Result','Player2Name','Player2Score','Winner'];
function sheet_() { const s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Results'); if (s.getLastRow() === 0) s.appendRow(HEAD); return s; }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    const name = String(d.name || '').trim().slice(0, 20), p2 = String(d.p2 || '').trim().slice(0, 20);
    const total = Number(d.total), score = Number(d.score), p2s = d.p2s === '' ? '' : Number(d.p2s);
    if (!name) return json_({ok:false, error:'name'});
    if (!Number.isInteger(total) || total < 1 || total > 500) return json_({ok:false, error:'total'});
    if (!Number.isInteger(score) || score < 0 || score > total) return json_({ok:false, error:'score'});
    if (Number(d.pct) !== Math.round(score / total * 100)) return json_({ok:false, error:'pct'});
    if (d.mode === '2 Player' && (!p2 || !Number.isInteger(p2s) || p2s < 0 || p2s > total)) return json_({ok:false, error:'p2'});
    if (['Solo','2 Player'].indexOf(d.mode) < 0) return json_({ok:false, error:'mode'});
    const winner = d.mode === 'Solo' ? '' : score > p2s ? name : p2s > score ? p2 : 'Draw';
    const pct = Math.round(score / total * 100);
    sheet_().appendRow([new Date(), name, d.mode, String(d.lang).slice(0, 10), total, score, pct, pct + '%', p2, d.mode === '2 Player' ? p2s : '', winner]);
    return json_({ok:true});
  } catch (err) { return json_({ok:false, error:String(err)}); }
}
function doGet(e) {
  const v = sheet_().getDataRange().getValues(); v.shift();
  return json_(v.slice(-500).map(r => ({DateTime:r[0], PlayerName:r[1], Mode:r[2], Language:r[3], TotalQuestions:r[4], Score:r[5], Percentage:r[6], Player2Name:r[8], Player2Score:r[9], Winner:r[10]})));
}
