const page = location.pathname.includes('home') || location.pathname.includes('profile') ? 0 :
    location.pathname.includes('fans') ? 1 :
        location.pathname.includes('follow') ? 2 : 3;

//获取数据列表
function getList() {
  let arr = [];
  if (location.pathname.includes('home') || location.pathname.includes('profile')) {//我的主页
    let listItemList = document.querySelectorAll('div[action-type="feed_list_item"]');
    for (let i = 0; i < listItemList.length; i++) {
      let item = listItemList[i];
      let mid = item.attributes['mid'].value;
      let contentText = item.querySelector('div[node-type=feed_list_content]').innerText;
      arr.push({
        mid,
        text: contentText
      })
    }
  } else if (location.pathname.includes('fans')) {//我的粉丝
    let listItemList = document.querySelectorAll('.follow_item.S_line2');
    for (let i = 0, len = listItemList.length; i < len; i++) {
      let item = listItemList[i];
      let action = item.attributes['action-data'].value;
      let actions = action.split('&');
      arr.push({
        mid: actions[0].split('=')[1],
        text: actions[1].split('=')[1]
      })
    }
  } else if (location.pathname.includes('follow')) {//我的关注
    let listItemList = document.getElementsByClassName('member_li S_bg1');
    for (let item of listItemList) {
      let actions = item.attributes['action-data'].value.split('&');
      let mid, text;
      for (let action of actions) {
        if (action.startsWith('uid')) {
          mid = action.split('=')[1]
        } else if (action.startsWith('screen_name')) {
          text = action.split('=')[1]
        }
      }

      arr.push({mid, text})
    }
  }

  return arr;
}

//发送消息-列表数据
chrome.runtime.sendMessage({type: 'getList', data: getList()}, function (response) {
  console.log(response.farewell);
});

//接受消息
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  switch (request.type) {
    case 'deleteMid'://post删除
      deleteMid(request.data);
      break;
    default:
      console.log('错误的类型');
  }
});

function deleteMid(data) {
  if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) {
      // setTimeout(()=>deleteMidItem(data[ i ]), 2000 * i);
      deleteMidItem(data[i]);
    }
  } else {
    deleteMidItem(data);
  }
  //删除完成后点击tab刷新
    setTimeout(function () {
        if (page === 2) {
            document.getElementsByClassName('lev_a current S_bg1')[0].click();
        } else
            document.querySelector('.WB_tab_b .S_line1').click();
    },2000);

}

function deleteMidItem(mid) {
  let path = 'aj/f/remove';//删除url路径
  if (page === 2) {
    path = 'aj/f/unfollow'
  }
  let xhr = new XMLHttpRequest();
  xhr.open('POST', `https://weibo.com/${path}?ajwvr=6`);
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  xhr.send(encodeURI('uid=' + mid));
  // xhr.send(encodeURI('fname=' + mid));//微博多余的参数
  // xhr.send(encodeURI('fnick=' + mid));
  // xhr.send(encodeURI('_t=' + 0));
  xhr.onreadystatechange = () => {
    if (xhr.readyState === 4) {//4代表执行完成
      if (xhr.status === 200) {//200代表执行成功
        chrome.runtime.sendMessage({type: 'deleteMidCallback', data: mid}, function () {
          console.log(eval("'" + xhr.responseText + "'"));
        });

      }
    }
  };
}

//@ sourceURL=getWeiBoList.js
