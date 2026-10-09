/**
 * 얼리액세스 신청자 — Google Apps Script 웹앱
 * 시트: https://docs.google.com/spreadsheets/d/1E_8UAI6TvFI8eAYX-GERpSY0DJu0o0Vod2ZYyQsPUyc/edit
 *
 * 배포 방법 (1회, 약 2분):
 *  1. 위 시트 열기 → 메뉴 [확장 프로그램] → [Apps Script]
 *  2. 기존 코드 전부 지우고 이 파일 내용 붙여넣기 → 저장(Ctrl+S)
 *  3. 아래 DASHBOARD_KEY 값을 원하는 비밀번호로 변경
 *  4. 우측 상단 [배포] → [새 배포] → 유형 선택(톱니바퀴) → [웹 앱]
 *     - 설명: signup api
 *     - 다음 사용자 인증 정보로 실행: 나
 *     - 액세스 권한이 있는 사용자: 모든 사용자
 *  5. [배포] → 권한 승인(고급 → 안전하지 않음으로 이동 → 허용)
 *  6. 발급된 "웹 앱 URL"(https://script.google.com/macros/s/.../exec)을 복사해서 전달
 */

var SHEET_NAME = '신청자';
var DASHBOARD_KEY = 'CHANGE_ME';   // 대시보드 조회용 비밀키 (반드시 변경)

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
}

// 가입 폼에서 POST → 시트에 한 줄 추가
function doPost(e) {
  try {
    var p = e.parameter || {};
    if (p._gotcha) return json({ ok: true });            // 봇 무시
    if (!p['이름'] || !p['이메일']) return json({ ok: false, error: 'missing' });
    var lock = LockService.getScriptLock(); lock.waitLock(5000);
    getSheet().appendRow([
      new Date(), p['이름'], p['이메일'], p['소속'] || '', p['관심분야'] || '', p['메모'] || '', p['동의'] || '예'
    ]);
    lock.releaseLock();
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

// 대시보드에서 GET ?key=... → JSON 반환
function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.key !== DASHBOARD_KEY) return json({ ok: false, error: 'unauthorized' });
  var rows = getSheet().getDataRange().getValues();
  var out = [];
  for (var i = 1; i < rows.length; i++) {
    if (!rows[i][1]) continue;
    out.push({
      t: rows[i][0] instanceof Date ? rows[i][0].toISOString() : String(rows[i][0]),
      name: rows[i][1], email: rows[i][2], org: rows[i][3], interest: rows[i][4], memo: rows[i][5]
    });
  }
  return json({ ok: true, count: out.length, rows: out, updated: new Date().toISOString() });
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
