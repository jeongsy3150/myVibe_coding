const 화면 = document.getElementById("game");
const 붓 = 화면.getContext("2d");
const 너비 = 1024;
const 높이 = 768;
const 세상 = { 너비: 2850, 높이: 2500 };
const 길폭 = 180;
const 경로 = [
  { x: 220, y: 2200 }, { x: 220, y: 1830 },
  { x: 480, y: 1540 }, { x: 940, y: 1510 },
  { x: 1310, y: 1220 }, { x: 1300, y: 880 },
  { x: 1710, y: 680 }, { x: 2150, y: 700 },
  { x: 2460, y: 390 }, { x: 2470, y: 120 }
];
const 키 = { 위: false, 아래: false, 왼쪽: false, 오른쪽: false, 드리프트: false, 부스터: false };
const 카트 = { x: 220, y: 2200, 각도: -Math.PI / 2, 속도: 0, 연료: 100, 미끄러짐: 0 };
const 상대들 = [
  { 이름: "번개", 색: "#ff695e", 거리: 0, 속도: 228, 옆위치: -30 },
  { 이름: "구름", 색: "#ffd44f", 거리: 0, 속도: 207, 옆위치: 30 }
];
let 상태 = "대기";
let 다음지점 = 1;
let 경과 = 0;
let 이전시간 = 0;
let 최고기록 = null;

function 초기화() {
  카트.x = 경로[0].x;
  카트.y = 경로[0].y;
  카트.각도 = -Math.PI / 2;
  카트.속도 = 0;
  카트.연료 = 100;
  카트.미끄러짐 = 0;
  다음지점 = 1;
  경과 = 0;
  상대들.forEach((상대, 번호) => { 상대.거리 = 번호 * 15; });
  상태 = "진행";
}

function 선분거리(x, y, a, b) {
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const 비율 = Math.max(0, Math.min(1, ((x - a.x) * vx + (y - a.y) * vy) / (vx * vx + vy * vy)));
  return Math.hypot(x - (a.x + vx * 비율), y - (a.y + vy * 비율));
}

function 길위인지(x, y) {
  for (let i = 1; i < 경로.length; i++) {
    if (선분거리(x, y, 경로[i - 1], 경로[i]) < 길폭 / 2) return true;
  }
  return false;
}

function 갱신(초) {
  if (상태 !== "진행") return;
  경과 += 초;
  상대들.forEach((상대) => { 상대.거리 += 상대.속도 * 초; });
  const 길위 = 길위인지(카트.x, 카트.y);
  const 드리프트중 = 키.드리프트 && Math.abs(카트.속도) > 55;
  const 부스터중 = 키.부스터 && 카트.연료 > 0 && 길위;
  const 최고속도 = 길위 ? (부스터중 ? 460 : 325) : 125;

  if (키.위) 카트.속도 += (부스터중 ? 470 : 285) * 초;
  if (키.아래) 카트.속도 -= 410 * 초;
  if (!키.위 && !키.아래) 카트.속도 *= Math.exp(-1.4 * 초);
  카트.속도 = Math.max(-130, Math.min(최고속도, 카트.속도));

  const 돌기 = Number(키.오른쪽) - Number(키.왼쪽);
  if (돌기 && Math.abs(카트.속도) > 4) {
    카트.각도 += 돌기 * (드리프트중 ? 3.1 : 2.2) * 초 * Math.sign(카트.속도);
    if (드리프트중) 카트.미끄러짐 = Math.min(1, 카트.미끄러짐 + 3 * 초);
  } else {
    카트.미끄러짐 = Math.max(0, 카트.미끄러짐 - 4 * 초);
  }

  카트.x += Math.cos(카트.각도 - 카트.미끄러짐 * 돌기 * 0.22) * 카트.속도 * 초;
  카트.y += Math.sin(카트.각도 - 카트.미끄러짐 * 돌기 * 0.22) * 카트.속도 * 초;
  카트.x = Math.max(20, Math.min(세상.너비 - 20, 카트.x));
  카트.y = Math.max(20, Math.min(세상.높이 - 20, 카트.y));

  if (부스터중) 카트.연료 = Math.max(0, 카트.연료 - 34 * 초);
  else 카트.연료 = Math.min(100, 카트.연료 + (드리프트중 && 길위 ? 25 : 8) * 초);

  if (Math.hypot(카트.x - 경로[다음지점].x, 카트.y - 경로[다음지점].y) < 100) {
    다음지점++;
    카트.연료 = Math.min(100, 카트.연료 + 12);
    if (다음지점 === 경로.length) {
      상태 = "완주";
      if (최고기록 === null || 경과 < 최고기록) 최고기록 = 경과;
    }
  }
}

function 가장가까운길위치() {
  let 가장짧은거리 = Infinity;
  let 길위치 = 0;
  let 누적길이 = 0;
  for (let i = 1; i < 경로.length; i++) {
    const a = 경로[i - 1], b = 경로[i];
    const dx = b.x - a.x, dy = b.y - a.y;
    const 길이 = Math.hypot(dx, dy);
    const 비율 = Math.max(0, Math.min(1, ((카트.x - a.x) * dx + (카트.y - a.y) * dy) / (길이 * 길이)));
    const 거리 = Math.hypot(카트.x - (a.x + dx * 비율), 카트.y - (a.y + dy * 비율));
    if (거리 < 가장짧은거리) {
      가장짧은거리 = 거리;
      길위치 = 누적길이 + 길이 * 비율;
    }
    누적길이 += 길이;
  }
  return 길위치;
}

function 길좌표(길위치) {
  let 남은길이 = Math.max(0, 길위치);
  for (let i = 1; i < 경로.length; i++) {
    const a = 경로[i - 1], b = 경로[i];
    const 길이 = Math.hypot(b.x - a.x, b.y - a.y);
    if (남은길이 <= 길이 || i === 경로.length - 1) {
      const 비율 = Math.min(1, 남은길이 / 길이);
      return { x: a.x + (b.x - a.x) * 비율, y: a.y + (b.y - a.y) * 비율, nx: -(b.y - a.y) / 길이, ny: (b.x - a.x) / 길이 };
    }
    남은길이 -= 길이;
  }
  return 경로[경로.length - 1];
}

function 투영(x, y) {
  const dx = x - 카트.x, dy = y - 카트.y;
  const 앞 = dx * Math.cos(카트.각도) + dy * Math.sin(카트.각도);
  const 오른쪽 = -dx * Math.sin(카트.각도) + dy * Math.cos(카트.각도);
  if (앞 < 35) return null;
  const 배율 = 540 / 앞;
  return { x: 너비 / 2 + 오른쪽 * 배율, y: 310 + 175 * 배율, 배율, 앞 };
}

function 하늘그리기() {
  const 하늘 = 붓.createLinearGradient(0, 0, 0, 350);
  하늘.addColorStop(0, "#6ccaff");
  하늘.addColorStop(1, "#d9f6ff");
  붓.fillStyle = 하늘;
  붓.fillRect(0, 0, 너비, 높이);
  붓.fillStyle = "rgba(255,255,255,0.95)";
  for (const [x, y, 크기] of [[120, 95, 45], [450, 70, 35], [780, 105, 52], [940, 62, 29]]) {
    붓.beginPath();
    붓.ellipse(x, y, 크기, 크기 * 0.4, 0, 0, Math.PI * 2);
    붓.ellipse(x + 크기 * 0.6, y - 10, 크기 * 0.7, 크기 * 0.48, 0, 0, Math.PI * 2);
    붓.fill();
  }
  붓.fillStyle = "#89b9b2";
  붓.beginPath();
  붓.moveTo(0, 310);
  for (let x = 0; x <= 너비; x += 55) 붓.lineTo(x, 245 + Math.sin(x * 0.013) * 25);
  붓.lineTo(너비, 340);
  붓.lineTo(0, 340);
  붓.fill();
  붓.fillStyle = "#68bb6a";
  붓.fillRect(0, 310, 너비, 높이 - 310);
  for (let i = 0; i < 15; i++) {
    const y = 320 + i * i * 2.3;
    붓.fillStyle = i % 2 ? "rgba(60,139,62,0.14)" : "rgba(184,231,104,0.15)";
    붓.fillRect(0, y, 너비, Math.max(4, i * 2));
  }
}

function 다각형(점들, 색) {
  if (점들.some((점) => 점 === null)) return;
  붓.fillStyle = 색;
  붓.beginPath();
  붓.moveTo(점들[0].x, 점들[0].y);
  for (let i = 1; i < 점들.length; i++) 붓.lineTo(점들[i].x, 점들[i].y);
  붓.closePath();
  붓.fill();
}

function 도로그리기() {
  const 현재길위치 = 가장가까운길위치();
  const 조각들 = [];
  for (let 거리 = 0; 거리 < 1300; 거리 += 35) {
    const a = 길좌표(현재길위치 + 거리);
    const b = 길좌표(현재길위치 + 거리 + 35);
    const 가장자리 = (점, 폭) => [
      투영(점.x + 점.nx * 폭, 점.y + 점.ny * 폭),
      투영(점.x - 점.nx * 폭, 점.y - 점.ny * 폭)
    ];
    const [a왼, a오] = 가장자리(a, 104);
    const [b왼, b오] = 가장자리(b, 104);
    const [a안왼, a안오] = 가장자리(a, 90);
    const [b안왼, b안오] = 가장자리(b, 90);
    const a중 = 투영(a.x, a.y), b중 = 투영(b.x, b.y);
    조각들.push({ a왼, a오, b왼, b오, a안왼, a안오, b안왼, b안오, a중, b중, 거리 });
  }
  for (let i = 조각들.length - 1; i >= 0; i--) {
    const 조각 = 조각들[i];
    다각형([조각.b왼, 조각.b오, 조각.a오, 조각.a왼], i % 2 ? "#e94d51" : "#ffffff");
    다각형([조각.b안왼, 조각.b안오, 조각.a안오, 조각.a안왼], i % 2 ? "#b8c1c9" : "#c7ced3");
    if (i % 2 === 0) 다각형([조각.b중, 조각.a중, { x: 조각.a중?.x + 3, y: 조각.a중?.y }, { x: 조각.b중?.x + 3, y: 조각.b중?.y }], "#f8fbff");
    if (i % 3 === 0 && 조각.a안왼 && 조각.a안오) {
      붓.strokeStyle = "rgba(85, 105, 120, 0.34)";
      붓.lineWidth = Math.max(1, 5 - i * 0.08);
      붓.beginPath();
      붓.moveTo(조각.a안왼.x, 조각.a안왼.y);
      붓.lineTo(조각.a안오.x, 조각.a안오.y);
      붓.stroke();
    }
  }
  return 현재길위치;
}

function 나무그리기(점, 종류) {
  const 위치 = 투영(점.x, 점.y);
  if (!위치 || 위치.앞 > 1400 || 위치.x < -130 || 위치.x > 너비 + 130) return;
  const 크기 = Math.min(2.4, Math.max(0.2, 위치.배율 * 0.95));
  붓.save();
  붓.translate(위치.x, 위치.y);
  붓.scale(크기, 크기);
  붓.fillStyle = "#77533b";
  붓.fillRect(-8, -55, 16, 55);
  붓.fillStyle = 종류 % 2 ? "#27945b" : "#30ad59";
  for (const [x, y, r] of [[0, -100, 39], [-28, -75, 27], [27, -75, 27]]) {
    붓.beginPath();
    붓.arc(x, y, r, 0, Math.PI * 2);
    붓.fill();
  }
  붓.restore();
}

function 건물그리기(점, 번호) {
  const 위치 = 투영(점.x, 점.y);
  if (!위치 || 위치.앞 > 1400 || 위치.x < -170 || 위치.x > 너비 + 170) return;
  const 크기 = Math.min(2, Math.max(0.15, 위치.배율 * 1.25));
  붓.save();
  붓.translate(위치.x, 위치.y);
  붓.scale(크기, 크기);
  붓.fillStyle = 번호 % 2 ? "#f6bd63" : "#f28c83";
  붓.fillRect(-60, -115, 120, 115);
  붓.fillStyle = "#e65c58";
  붓.beginPath();
  붓.moveTo(-72, -115);
  붓.lineTo(0, -160);
  붓.lineTo(72, -115);
  붓.fill();
  붓.fillStyle = "#b9ecff";
  붓.fillRect(-43, -85, 29, 30);
  붓.fillRect(14, -85, 29, 30);
  붓.fillStyle = "#925344";
  붓.fillRect(-15, -43, 30, 43);
  붓.restore();
}

function 풍경그리기(현재길위치) {
  const 장식 = [];
  for (let 거리 = 120; 거리 < 1350; 거리 += 125) {
    const 점 = 길좌표(현재길위치 + 거리);
    for (const 방향 of [-1, 1]) {
      장식.push({
        x: 점.x + 점.nx * (155 + (거리 % 3) * 30) * 방향,
        y: 점.y + 점.ny * (155 + (거리 % 3) * 30) * 방향,
        거리, 번호: Math.floor(거리 / 125) + (방향 + 1)
      });
    }
  }
  장식.sort((a, b) => b.거리 - a.거리);
  for (const 점 of 장식) {
    if (점.번호 % 4 === 0) 건물그리기(점, 점.번호);
    else 나무그리기(점, 점.번호);
  }
  간판그리기(현재길위치);
  const 다음표식 = 경로[다음지점];
  if (!다음표식) return;
  const 남은거리 = Math.hypot(카트.x - 다음표식.x, 카트.y - 다음표식.y);
  const 표식 = 투영(다음표식.x, 다음표식.y);
  if (표식 && 남은거리 < 1200 && 표식.x > 0 && 표식.x < 너비) {
    붓.fillStyle = "#ffda2a";
    붓.strokeStyle = "#fff";
    붓.lineWidth = 4;
    붓.beginPath();
    붓.moveTo(표식.x, 표식.y - 50 * 표식.배율);
    붓.lineTo(표식.x - 21 * 표식.배율, 표식.y - 78 * 표식.배율);
    붓.lineTo(표식.x + 21 * 표식.배율, 표식.y - 78 * 표식.배율);
    붓.closePath();
    붓.fill();
    붓.stroke();
  }
}

function 간판그리기(현재길위치) {
  const 간판길위치 = Math.ceil((현재길위치 + 250) / 650) * 650;
  const 점 = 길좌표(간판길위치);
  const 왼쪽 = 투영(점.x + 점.nx * 125, 점.y + 점.ny * 125);
  const 오른쪽 = 투영(점.x - 점.nx * 125, 점.y - 점.ny * 125);
  if (!왼쪽 || !오른쪽 || 왼쪽.앞 > 1100) return;
  const 위쪽 = Math.min(왼쪽.y, 오른쪽.y) - Math.max(20, 65 * 왼쪽.배율);
  붓.strokeStyle = "#e6e8ed";
  붓.lineWidth = Math.max(2, 8 * 왼쪽.배율);
  붓.beginPath();
  붓.moveTo(왼쪽.x, 왼쪽.y);
  붓.lineTo(왼쪽.x, 위쪽);
  붓.moveTo(오른쪽.x, 오른쪽.y);
  붓.lineTo(오른쪽.x, 위쪽);
  붓.stroke();
  const x = Math.min(왼쪽.x, 오른쪽.x);
  const 폭 = Math.abs(오른쪽.x - 왼쪽.x);
  붓.fillStyle = "#ef5a51";
  붓.fillRect(x, 위쪽 - 23, 폭, 37);
  붓.fillStyle = "#fff";
  붓.font = `bold ${Math.max(12, Math.min(28, 19 * 왼쪽.배율))}px 'Malgun Gothic', sans-serif`;
  붓.textAlign = "center";
  붓.fillText("꼬마 카트 레이스", x + 폭 / 2, 위쪽 + 3);
}

function 상대그리기() {
  for (const 상대 of [...상대들].sort((a, b) => b.거리 - a.거리)) {
    const 길 = 길좌표(상대.거리);
    const 위치 = 투영(길.x + 길.nx * 상대.옆위치, 길.y + 길.ny * 상대.옆위치);
    if (!위치 || 위치.앞 > 1000 || 위치.x < -100 || 위치.x > 너비 + 100) continue;
    const 크기 = Math.max(0.2, Math.min(1.2, 위치.배율 * 0.8));
    붓.save();
    붓.translate(위치.x, 위치.y);
    붓.scale(크기, 크기);
    붓.fillStyle = "#202b3e";
    붓.fillRect(-29, -8, 16, 34);
    붓.fillRect(13, -8, 16, 34);
    붓.fillStyle = 상대.색;
    붓.beginPath();
    붓.roundRect(-25, -38, 50, 62, 13);
    붓.fill();
    붓.fillStyle = "#fce6bd";
    붓.beginPath();
    붓.arc(0, -36, 15, 0, Math.PI * 2);
    붓.fill();
    붓.fillStyle = 상대.색;
    붓.beginPath();
    붓.arc(0, -45, 16, Math.PI, Math.PI * 2);
    붓.fill();
    붓.restore();
  }
}

function 카트그리기() {
  const 흔들림 = 상태 === "진행" ? Math.sin(경과 * 17) * Math.min(3, Math.abs(카트.속도) / 100) : 0;
  붓.save();
  붓.translate(512, 646 + 흔들림);
  붓.fillStyle = "rgba(16, 41, 56, 0.35)";
  붓.beginPath();
  붓.ellipse(0, 72, 100, 22, 0, 0, Math.PI * 2);
  붓.fill();
  붓.fillStyle = "#192e48";
  붓.fillRect(-91, 14, 30, 83);
  붓.fillRect(61, 14, 30, 83);
  붓.fillStyle = "#17a8df";
  붓.beginPath();
  붓.roundRect(-73, -21, 146, 120, 28);
  붓.fill();
  붓.fillStyle = "#168fca";
  붓.beginPath();
  붓.ellipse(0, -64, 67, 54, 0, 0, Math.PI * 2);
  붓.fill();
  붓.fillStyle = "#49d9f5";
  붓.beginPath();
  붓.ellipse(-17, -78, 35, 24, -0.25, 0, Math.PI * 2);
  붓.fill();
  붓.fillStyle = "#146ba8";
  붓.beginPath();
  붓.ellipse(-55, -51, 16, 22, -0.2, 0, Math.PI * 2);
  붓.ellipse(55, -51, 16, 22, 0.2, 0, Math.PI * 2);
  붓.fill();
  붓.fillStyle = "#193c6c";
  붓.fillRect(-44, 12, 88, 51);
  붓.fillStyle = "#ecfaff";
  붓.fillRect(-50, 29, 23, 25);
  붓.fillRect(27, 29, 23, 25);
  붓.fillStyle = "#ffe46b";
  붓.fillRect(-29, 71, 58, 16);
  붓.fillStyle = "#192e48";
  붓.font = "bold 18px 'Malgun Gothic', sans-serif";
  붓.textAlign = "center";
  붓.fillText("GO!", 0, 85);
  붓.restore();
}

function 작은지도그리기() {
  const x = 815, y = 175, w = 180, h = 205;
  붓.fillStyle = "rgba(21, 46, 79, 0.5)";
  붓.beginPath();
  붓.roundRect(x, y, w, h, 16);
  붓.fill();
  붓.strokeStyle = "#ecf8ff";
  붓.lineWidth = 4;
  붓.beginPath();
  붓.moveTo(x + 17 + 경로[0].x / 세상.너비 * (w - 34), y + 20 + 경로[0].y / 세상.높이 * (h - 45));
  for (let i = 1; i < 경로.length; i++) {
    붓.lineTo(x + 17 + 경로[i].x / 세상.너비 * (w - 34), y + 20 + 경로[i].y / 세상.높이 * (h - 45));
  }
  붓.stroke();
  붓.fillStyle = "#ffdd42";
  붓.beginPath();
  붓.arc(x + 17 + 카트.x / 세상.너비 * (w - 34), y + 20 + 카트.y / 세상.높이 * (h - 45), 7, 0, Math.PI * 2);
  붓.fill();
  붓.fillStyle = "#fff";
  붓.font = "bold 17px 'Malgun Gothic', sans-serif";
  붓.textAlign = "center";
  붓.fillText("코스 지도", x + w / 2, y + h - 12);
}

function 속도계그리기() {
  붓.save();
  붓.translate(896, 649);
  붓.fillStyle = "rgba(17, 39, 67, 0.92)";
  붓.beginPath();
  붓.arc(0, 0, 102, 0, Math.PI * 2);
  붓.fill();
  붓.strokeStyle = "#59cfff";
  붓.lineWidth = 11;
  붓.beginPath();
  붓.arc(0, 0, 79, Math.PI * 0.75, Math.PI * 2.25);
  붓.stroke();
  붓.strokeStyle = "#ffcc36";
  붓.beginPath();
  붓.arc(0, 0, 79, Math.PI * 0.75, Math.PI * (0.75 + 1.5 * Math.min(1, Math.abs(카트.속도) / 460)));
  붓.stroke();
  const 바늘각 = Math.PI * (0.75 + 1.5 * Math.min(1, Math.abs(카트.속도) / 460));
  붓.strokeStyle = "#ff475d";
  붓.lineWidth = 5;
  붓.beginPath();
  붓.moveTo(0, 0);
  붓.lineTo(Math.cos(바늘각) * 64, Math.sin(바늘각) * 64);
  붓.stroke();
  붓.fillStyle = "#fff";
  붓.font = "bold 46px 'Malgun Gothic', sans-serif";
  붓.textAlign = "center";
  붓.fillText(String(Math.round(Math.abs(카트.속도))), 0, 16);
  붓.font = "16px 'Malgun Gothic', sans-serif";
  붓.fillText("속도", 0, 46);
  붓.restore();
}

function 정보그리기() {
  작은지도그리기();
  붓.fillStyle = "rgba(132, 211, 249, 0.48)";
  for (let i = 0; i < 2; i++) {
    붓.beginPath();
    붓.roundRect(22 + i * 76, 22, 66, 66, 8);
    붓.fill();
    붓.strokeStyle = "#fff";
    붓.lineWidth = 3;
    붓.stroke();
  }

  const 내거리 = 가장가까운길위치();
  const 순위 = 1 + 상대들.filter((상대) => 상대.거리 > 내거리).length;
  붓.fillStyle = "#ffe83a";
  붓.strokeStyle = "#283143";
  붓.lineWidth = 5;
  붓.font = "bold 55px 'Malgun Gothic', sans-serif";
  붓.textAlign = "left";
  붓.strokeText(`${순위}위`, 24, 153);
  붓.fillText(`${순위}위`, 24, 153);
  붓.font = "bold 17px 'Malgun Gothic', sans-serif";
  const 이름들 = ["나", ...상대들.map((상대) => 상대.이름)];
  이름들.forEach((이름, 번호) => {
    붓.fillStyle = 번호 === 0 ? "#24bcf2" : 상대들[번호 - 1].색;
    붓.beginPath();
    붓.arc(34, 182 + 번호 * 25, 7, 0, Math.PI * 2);
    붓.fill();
    붓.fillStyle = "#fff";
    붓.strokeText(이름, 49, 188 + 번호 * 25);
    붓.fillText(이름, 49, 188 + 번호 * 25);
  });

  붓.fillStyle = "rgba(21, 46, 79, 0.68)";
  붓.beginPath();
  붓.roundRect(697, 20, 300, 126, 10);
  붓.fill();
  붓.fillStyle = "#fff";
  붓.textAlign = "left";
  붓.font = "bold 23px 'Malgun Gothic', sans-serif";
  붓.fillText(`구간  ${Math.min(다음지점, 경로.length - 1)} / ${경로.length - 1}`, 716, 56);
  붓.fillText(`시간  ${경과.toFixed(1)}초`, 716, 88);
  붓.font = "bold 17px 'Malgun Gothic', sans-serif";
  붓.fillText(`최고  ${최고기록 === null ? "—" : 최고기록.toFixed(1) + "초"}`, 716, 119);
  붓.fillStyle = "rgba(21, 46, 79, 0.85)";
  붓.beginPath();
  붓.roundRect(24, 702, 285, 46, 12);
  붓.fill();
  붓.fillStyle = "#facc15";
  붓.fillRect(98, 718, 195 * 카트.연료 / 100, 15);
  붓.fillStyle = "#fff";
  붓.font = "bold 16px 'Malgun Gothic', sans-serif";
  붓.fillText("부스터", 34, 732);
  속도계그리기();
}

function 안내그리기() {
  if (상태 === "진행") return;
  붓.fillStyle = "rgba(17, 38, 59, 0.85)";
  붓.beginPath();
  붓.roundRect(220, 190, 584, 178, 20);
  붓.fill();
  붓.fillStyle = "#fff";
  붓.textAlign = "center";
  붓.font = "bold 37px 'Malgun Gothic', sans-serif";
  붓.fillText(상태 === "완주" ? "도착했습니다!" : "레이스 준비!", 512, 255);
  붓.font = "21px 'Malgun Gothic', sans-serif";
  붓.fillText(상태 === "완주" ? `기록 ${경과.toFixed(1)}초` : "앞에 보이는 도로와 노란 표식을 따라 달리세요", 512, 305);
  붓.fillText("Enter 시작 / 다시 시작 · R 처음부터", 512, 342);
}

function 반복(시간) {
  const 초 = Math.min(0.04, Math.max(0, (시간 - 이전시간) / 1000));
  이전시간 = 시간;
  갱신(초);
  하늘그리기();
  const 현재길위치 = 도로그리기();
  풍경그리기(현재길위치);
  상대그리기();
  카트그리기();
  정보그리기();
  안내그리기();
  requestAnimationFrame(반복);
}
document.addEventListener("keydown", (이벤트) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", "ShiftLeft", "ShiftRight", "Enter", "KeyR"].includes(이벤트.code)) 이벤트.preventDefault();
  if (이벤트.code === "Enter" && !이벤트.repeat && 상태 !== "진행") 초기화();
  if (이벤트.code === "KeyR" && !이벤트.repeat) 초기화();
  if (이벤트.code === "ArrowUp") 키.위 = true;
  if (이벤트.code === "ArrowDown") 키.아래 = true;
  if (이벤트.code === "ArrowLeft") 키.왼쪽 = true;
  if (이벤트.code === "ArrowRight") 키.오른쪽 = true;
  if (이벤트.code === "Space") 키.드리프트 = true;
  if (이벤트.code === "ShiftLeft" || 이벤트.code === "ShiftRight") 키.부스터 = true;
});

document.addEventListener("keyup", (이벤트) => {
  if (이벤트.code === "ArrowUp") 키.위 = false;
  if (이벤트.code === "ArrowDown") 키.아래 = false;
  if (이벤트.code === "ArrowLeft") 키.왼쪽 = false;
  if (이벤트.code === "ArrowRight") 키.오른쪽 = false;
  if (이벤트.code === "Space") 키.드리프트 = false;
  if (이벤트.code === "ShiftLeft" || 이벤트.code === "ShiftRight") 키.부스터 = false;
});

window.addEventListener("blur", () => {
  for (const 이름 of Object.keys(키)) 키[이름] = false;
});

requestAnimationFrame(반복);

