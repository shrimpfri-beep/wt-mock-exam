// 구글 시트 '퀴즈 참여 기록'에 연결된 Apps Script 웹 앱 주소
window.WT_API = 'https://script.google.com/macros/s/AKfycbw8QhOa0a62-pDU3YHeXlDue_7KhuNHgGg_DarUIuXYbjLBjiBek1hGBI2MA67bIvWM8w/exec';

// 점수 순위 기능 (풀이 순서 + 점수 순위)
window.addEventListener('DOMContentLoaded', function () {
  if (document.getElementById('rankLink')) return;
  var $ = function (id) { return document.getElementById(id) };
  var escH = function (t) { return String(t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] }) };

  function ranked(list) {
    var sorted = list.slice().sort(function (a, b) { return b.score - a.score || a.order - b.order });
    var rank = 0, prev = null;
    return sorted.map(function (r, i) { if (r.score !== prev) { rank = i + 1; prev = r.score } return Object.assign({}, r, { rank: rank }) });
  }

  // 첫 화면: 점수 순위 보기 링크
  var link = document.createElement('button');
  link.className = 'link'; link.id = 'rankLink'; link.type = 'button'; link.textContent = '점수 순위 보기';
  $('joined').parentElement.after(link);

  // 결과 화면: 제목과 '처음으로' 버튼
  $('boardTitle').textContent = '점수 순위';
  $('refreshBtn').textContent = '순위 새로고침';
  $('myOrder').style.textWrap = 'balance';
  var home = document.createElement('button');
  home.className = 'btn ghost'; home.id = 'homeBtn2'; home.type = 'button'; home.textContent = '처음으로';
  $('refreshBtn').after(home);
  var scoreBox = $('final').parentElement;

  window.renderBoard = function (d) {
    var ul = $('ranks'); ul.innerHTML = '';
    var list = d ? ranked(d.list) : [];
    list.forEach(function (r) {
      var li = document.createElement('li'); if (r.name === nickname) li.className = 'me';
      var no = document.createElement('span'); no.className = 'no'; no.textContent = r.rank + '위';
      var nm = document.createElement('span'); nm.className = 'nm'; nm.textContent = r.name;
      var sc = document.createElement('span'); sc.className = 'sc'; sc.textContent = r.score + '점';
      li.append(no, nm, sc); ul.appendChild(li);
    });
    $('boardCount').textContent = d ? ('참여 ' + list.length + ' / ' + MAX_PEOPLE + '명') : '';
    $('boardMsg').textContent = !d ? '순위를 불러오지 못했어요. 잠시 후 새로고침해 주세요.' : list.length ? '' : '아직 참여한 사람이 없어요.';
    return list;
  };

  window.finish = async function () {
    var pts = Math.round(score / round.length * 100);
    scoreBox.hidden = false;
    $('final').innerHTML = pts + '<small>점</small>';
    $('myOrder').textContent = '점수를 저장하는 중…';
    window.renderBoard({ list: [] }); $('boardMsg').textContent = '';
    show('result');
    var d = null;
    try { d = await api({ name: nickname, score: pts }) } catch (e) {}
    var list = window.renderBoard(d);
    var me = list.filter(function (r) { return r.name === nickname })[0];
    var who = escH(nickname) + '님은 ';
    if (d && me && d.status !== 'dup') $('myOrder').innerHTML = who + me.order + '번째로 풀었고, ' + list.length + '명 중 <b>' + me.rank + '위</b>예요';
    else if (d && me) $('myOrder').innerHTML = who + '이미 참여했어요 (현재 <b>' + me.rank + '위</b>)';
    else if (d && d.status === 'full') $('myOrder').textContent = MAX_PEOPLE + '명이 모두 참여해서 점수가 기록되지 않았어요';
    else $('myOrder').textContent = '점수를 저장하지 못했어요';
  };

  link.addEventListener('click', async function () {
    scoreBox.hidden = true; $('myOrder').textContent = '';
    window.renderBoard({ list: [] }); $('boardMsg').textContent = '불러오는 중…';
    show('result');
    var d = null; try { d = await api() } catch (e) {}
    window.renderBoard(d);
  });
  home.addEventListener('click', function () {
    scoreBox.hidden = false; loadJoined(); show('home');
  });
});
