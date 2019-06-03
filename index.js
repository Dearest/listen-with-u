const startShareBtn = document.getElementById('startShare')
const modeSelect = document.getElementById('mode')
const audioDeviceSelect = document.getElementById('audioDevice')
const videoDeviceSelect = document.getElementById('videoDevice')
const localVideo = document.getElementById('localVideo')
const remoteVideo = document.getElementById('remoteVideo')

// 全局房间对象
const myRoom = new QNRTC.StreamModeSession()

// 如果此时枚举设备的操作完成，就更新页面设备列表
if (QNRTC.deviceManager.deviceInfo) {
  addDeviceToSelect(QNRTC.deviceManager.deviceInfo)
}
// 当检测到枚举完成或者设备列表更新的时候，更新页面设备列表
QNRTC.deviceManager.on('device-update', deviceInfo => {
  addDeviceToSelect(deviceInfo)
})

// 将枚举到的设备信息添加到页面上
function addDeviceToSelect (deviceInfo) {
  // 清空之前 select 下的元素，重新遍历添加
  while (audioDeviceSelect.firstChild) {
    audioDeviceSelect.removeChild(audioDeviceSelect.firstChild)
  }
  while (videoDeviceSelect.firstChild) {
    videoDeviceSelect.removeChild(videoDeviceSelect.firstChild)
  }

  // 遍历每个设备，添加到页面上供用户选择
  deviceInfo.forEach(info => {
    const optionElement = document.createElement('option')
    optionElement.value = info.deviceId
    optionElement.text = info.label
    if (info.kind === 'audioinput') {
      console.log(optionElement)
      audioDeviceSelect.appendChild(optionElement)
    } else if (info.kind === 'videoinput') {
      console.log(optionElement)
      videoDeviceSelect.appendChild(optionElement)
    }
  })
}

function getRoomToken () {
  return '8F4hBLl59vU5WcYbOJ6JxyiE4O9UfwU-zYRnCjaO:f5J-IwPTmXsBbXugRisS3ivkPe8=:eyJhcHBJZCI6ImU3OHIweG94aiIsInJvb21OYW1lIjoibWVsb24iLCJ1c2VySWQiOiJqaWFjaGVuZyIsImV4cGlyZUF0IjoxNTU5NjI5MzY0LCJwZXJtaXNzaW9uIjoidXNlciJ9'
}

async function joinRoom () {
  const roomToken = getRoomToken()
  try {
  // 加入房间
    const users = await myRoom.joinRoomWithToken(roomToken)
    autoSubscribe()
  } catch (e) {
    console.error(e)
    alert(`加入房间失败！ErrorCode: ${e.code || ''}`)
  }
}

async function subscribeUser (userId) {
  // 订阅目标用户
  const remoteStream = await myRoom.subscribe(userId)
  remoteStream.play(remoteVideo)
}

function autoSubscribe () {
  const users = myRoom.users
  for (const user of users) {
    if (user.userId !== myRoom.userId && user.published) {
      subscribeUser(user.userId)
    }
  }

  myRoom.on('user-publish', (user) => {
    console.log('user', user.userId, 'is publushed')
    subscribeUser(user.userId)
  })
}

async function publish () {
  let stream
  try {
    // 通过用户在页面上指定的设备发起采集
    // 也可以不指定设备，这样会由浏览器自动选择

    const mode = modeSelect.value
    let localStreamMode = {}
    switch (mode) {
      case '0':
        localStreamMode = { audio: {
          enabled: true,
          deviceId: audioDeviceSelect.value,
          bitrate: 64 },
        screen: {
          enabled: true }
        }
        break
      case '1':
        localStreamMode = { audio: {
          enabled: true,
          deviceId: audioDeviceSelect.value,
          bitrate: 64 },
        video: {
          enabled: true,
          deviceId: audioDeviceSelect.value }
        }
        break
      default:
        localStreamMode = { audio: {
          enabled: true,
          deviceId: audioDeviceSelect.value,
          bitrate: 64 },
        video: {
          enabled: false }
        }
        break
    }
    stream = await QNRTC.deviceManager.getLocalStream(localStreamMode)
  } catch (e) {
    console.error(e)
    alert(`采集失败，请检查您的设备。ErrorCode: ${e.code}`)
    return
  }

  // 将采集到的流静音播放
  stream.play(localVideo, true)

  try {
    // 发布采集流
    await myRoom.publish(stream)
  } catch (e) {
    console.error(e)
    alert(`发布失败，ErrorCode: ${e.code}`)
  }
}

$(document).ready(function () {
  joinRoom()
  $('.select').select2()
  startShareBtn.addEventListener('click', publish)
})
