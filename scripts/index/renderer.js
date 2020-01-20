const { ipcRenderer } = require('electron');
$(document).ready(function () {
    faceapi.env.monkeyPatch({
        Canvas: HTMLCanvasElement,
        Image: HTMLImageElement,
        ImageData: ImageData,
        Video: HTMLVideoElement,
        createCanvasElement: () => document.createElement('canvas'),
        createImageElement: () => document.createElement('img')
    })
    const fs = require('fs');
    faceapi.env.setEnv(Object.assign(faceapi.env.createBrowserEnv(), faceapi.env.createFileSystem(fs)));

    vmStart();
});
var vm;
var setTimeOut;
var dateSetTimeOut;
var uploadSetTimeOut;

function vmStart() {

    vm = new Vue({
        el: "#clock",
        data: {
            ImgCheck: false,
            Account: "guo88882",
            Password: "0916366546",
            Guid: "",
            CheckUser: true,
            carrier: "",
            keyinEmpSn: "",
            SuccessMsgTEST: false,
            SuccessMsg: false,
            fullscreenLoading: false,
            loginDialog: false,
            InputDis: false,
            WaitMsg: false,
            Ing: false,
            WaitMsgCount: 0,
            CompanyId: 1,
            SuccessMsgStr: "",
            SuccessEmpSn: "",
            SuccessDepName: "",
            SuccessJobName: "",
            SuccessCount: 0,
            SuccessNowDate: "",
            MsgTitle: "打卡狀態",
            nowPic: "",
            nowDate: null,
            nowTime: null,
            DateStyle: "width:100%;font-size:13vmin;color:forestgreen;margin:5px",
            ClockStatus: 1,
            ViewIndexCount: 1,
            UploadFileList: [],
            UploadIng: false,
            count: 1,
            BtnStyle1: "display:inline-block; width:30%;height:100%;border:inset;border-color:red;border-width:10px;",
            BtnStyle2: "display:inline-block; width:30%;height:100%;",
            //ClockApiPath: "http://localhost:58844/api/",
            RecordList: [],
            ClockApiPath: "https://hr.kingnetsmart.com.tw/Emp_Clock/api/",
            UploadApiPath: "https://hr.kingnetsmart.com.tw/KingnetAppApi/api/",
            NewEIPApiPath: "https://hr.kingnetsmart.com.tw/NewEIP_API/api/",
            now: null,
            notification: false,
            message: "",
            closeBtn: false,
            restartBtn: false,
            LengthTitle: "錯誤",
            LengthError: false,
            ImageMap: null,
            Video: null,
            Canvas: null,
            CheckToImg: [],
            FaceCheckCount: 0,
            FaceCheckName: "",
            FaceTopName: "",
            ViewEmpSn: "",
            CheckGetFaceOne: false,
        },
        computed: {
            newRecordList: function () {
                return this.RecordList.slice(-2);
            }
        },
        watch: {
            "CheckToImg": function () {

            },
            "nowTime": function () {
                var now = new Date();//生成日期物件(完整的日期資訊)
                var y = now.getFullYear();//年份
                var M = vm.changeDateChar(now.getMonth() + 1);//月份
                var d = vm.changeDateChar(now.getDate());//日期

                var strS = y + '/' + M + '/' + d + " 09:01:00";
                var strD = y + '/' + M + '/' + d + " 18:00:00";
                var changeStatusSDS = y + '/' + M + '/' + d + " 07:30:00";
                var changeStatusSDD = y + '/' + M + '/' + d + " 07:30:05";

                var changeStatusDDS = y + '/' + M + '/' + d + " 16:20:00";
                var changeStatusDDD = y + '/' + M + '/' + d + " 16:20:05";

                if (now >= Date.parse(strS).valueOf() && now <= Date.parse(strD).valueOf()) {
                    vm.DateStyle = "width:100%;font-size:4.5rem;color:orange;margin:5px";
                }
                else {
                    vm.DateStyle = "width:100%;font-size:4.5rem;color:forestgreen;margin:5px";
                }

                if (now >= Date.parse(changeStatusSDS).valueOf() && now <= Date.parse(changeStatusSDD).valueOf()) {
                    ipcRenderer.send('restartV');
                }
                if (now >= Date.parse(changeStatusDDS).valueOf() && now <= Date.parse(changeStatusDDD).valueOf()) {
                    vm.changeStatus(2);
                }
            },
            "SuccessCount": function () {
                clearTimeout(uploadSetTimeOut);
                clearTimeout(setTimeOut);

                //if (vm.$refs.clockcard != null) {
                //    window.setTimeout(function () {
                //        vm.$refs.clockcard.setActiveItem(vm.ViewIndexCount);
                //        vm.ViewIndexCount += 1;
                //    }, 500);
                //}

                vm.carrier = "";
                //vm.InputDis = false;
                vm.UploadIng = false;
                // if (vm.SuccessMsg == true) {
                setTimeOut = window.setTimeout(function () {
                    vm.SuccessMsg = false;
                    vm.RecordList = [];
                    vm.ViewIndexCount = 0;
                    //$("#cerrier").focus();
                }, 5000);
                //}
                window.setTimeout(function () {
                    $("#cerrier").focus();
                    vm.carrier = "";
                    vm.Ing = false;
                    vm.fullscreenLoading = false;
                }, 300);

                uploadSetTimeOut = setTimeout(function () {
                    vm.UploadIng = true;
                    vm.UploadFileList = vm.UploadFileList.filter(mod => mod.UploadStatus == false);
                    vm.uploadClockInOutImg(vm.UploadFileList);
                }, 5000);
            },
            "WaitMsgCount": function () {
                vm.carrier = "";
                if (vm.WaitMsg == true) {
                    window.setTimeout(function () {
                        vm.WaitMsg = false;
                        // vm.carrier = "";
                    }, 300);
                }
            }
        },
        mounted: function () {
            this.Video = document.getElementById('inputVideo');
            this.Canvas = document.getElementById('box');
            this.face();
            this.newDate();
            this.$nextTick(function () {
                vm.GetCompanyGuid();
                window.setInterval(function () {
                    vm.GetCompanyGuid();
                    vm.getFace();
                }, 1800000);
                ipcRenderer.send('app_version');
                ipcRenderer.on('app_version', (event, arg) => {
                    ipcRenderer.removeAllListeners('app_version');
                    document.getElementById('version').innerText = 'Version ' + arg.version;
                });

                ipcRenderer.on('update_available', () => {
                    ipcRenderer.removeAllListeners('update_available');
                    vm.message = '有更新版本，下載後會自動安裝並重新啟動程式';
                    vm.fullscreenLoading = true
                    vm.notification = true;
                    ipcRenderer.send('restart_app');
                });
                ipcRenderer.on('update_downloaded', () => {
                    ipcRenderer.removeAllListeners('update_downloaded');
                    vm.message = '重新啟動中...';
                    //vm.restartBtn = true;
                    vm.notification = true;
                    ipcRenderer.send('restart_app');

                });

            });
            $("#cerrier").focus();
        },
        methods: {
            face: async function () {
                console.log('start');
                console.log('face')
                //  await faceapi.nets.ssdMobilenetv1.loadFromUri('../node_modules/face-api.js/weights')
                await faceapi.loadTinyFaceDetectorModel('../node_modules/face-api.js/weights')
                // await faceapi.loadMtcnnModel('../node_modules/face-api.js/weights')
                await faceapi.loadFaceRecognitionModel('../node_modules/face-api.js/weights')
                await faceapi.loadFaceLandmarkTinyModel('../node_modules/face-api.js/weights')
                await faceapi.nets.faceLandmark68Net.loadFromUri('../node_modules/face-api.js/weights')
                console.log('ok');
                //this.onPlay();
                const stream = await navigator.mediaDevices.getUserMedia({ video: {} })
                //const videoEl = $('#inputVideo').get(0)
                vm.Video.srcObject = stream
                await vm.getFace();
                //faceapi.SsdMobilenetv1Options.minConfidence = 0.4;

                //const mtcnnResults = await faceapi.mtcnn(document.getElementById('canvas'), mtcnnForwardParams)

                //console.log(mtcnnResults)

                //faceapi.drawDetections('overlay', mtcnnResults.map(res => res.faceDetection), { withScore: false })
                //faceapi.drawFaceLandmarks('overlay', mtcnnResults.map(res => res.faceLandmarks), { lineWidth: 4, color: 'red' })

                // try to access users webcam and stream the images
                // to the video element

                //await faceapi.loadSsdMobilenetv1Model('../node_modules/face-api.js/weights')
                //await faceapi.loadFaceLandmarkModel('../node_modules/face-api.js/weights')
                //await faceapi.loadFaceRecognitionModel('../node_modules/face-api.js/weights')

                //const canvas = document.getElementById('canvas1')
                //const input = document.getElementById('myImage')
                //let fullFaceDescriptions = await faceapi.detectAllFaces(input).withFaceLandmarks().withFaceDescriptors();
                //console.log(fullFaceDescriptions);
                ////fullFaceDescriptions = faceapi.resizeResults(fullFaceDescriptions)
                //faceapi.draw.drawDetections(canvas, fullFaceDescriptions)
                //console.log(faceapi);
                //faceapi.draw.drawFaceLandmarks(canvas, fullFaceDescriptions)
            },
            onPlay: async function onPlay() {
                //const canvas = document.getElementById('canvas')
                //const myImage = document.getElementById('myImage')
                // const videoEl = $('#inputVideo').get(0)
                // const canvas1 = document.getElementById('box')

                //vm.ImageMap = await faceapi
                //    .detectAllFaces(myImage, new faceapi.TinyFaceDetectorOptions())
                //    .withFaceLandmarks()
                //    .withFaceDescriptors()

                //if (!vm.ImageMap.length) {
                //    return
                //}
                //   console.log(vm.ImageMap)
                const faceMatcher = new faceapi.FaceMatcher(vm.ImageMap)
                const singleResult = await faceapi
                    .detectSingleFace(vm.Video, new faceapi.TinyFaceDetectorOptions({ inputSize: 160 }))
                    .withFaceLandmarks(true)
                    .withFaceDescriptor()
                var name;
                var distance;
                if (singleResult) {
                    const bestMatch = faceMatcher.findBestMatch(singleResult.descriptor)
                    name = bestMatch.label;
                    if (vm.FaceCheckName != name) {
                        vm.FaceCheckName = '';
                    }
                    else {
                        vm.FaceCheckName = name;
                    }
                    distance = bestMatch.distance.toFixed(2);
                    if (parseFloat(distance) <= 0.4) {
                        const displaySize = { width: 640, height: 480 }
                        const resizedResults = faceapi.resizeResults(singleResult, displaySize)

                        const dims = faceapi.matchDimensions(vm.Canvas, vm.Video, true)

                        // faceapi.draw.drawDetections(canvas1, resizedResults)
                        //faceapi.draw.drawFaceLandmarks(canvas1, resizedResults)
                        //console.log(resizedResults)
                        const drawOptions = {
                            label: name + '---' + distance
                        }

                        var x = resizedResults.detection.box.x;
                        var y = resizedResults.detection.box.y;
                        var w = resizedResults.detection.box.width;
                        var h = resizedResults.detection.box.height;

                        const box = { x: x, y: y, width: w, height: h }
                        const drawBox = new faceapi.draw.DrawBox(box, drawOptions)
                        drawBox.draw(vm.Canvas, resizedResults)
                        vm.ViewEmpSn = name;
                        //if (vm.FaceCheckName == name) {
                        //    vm.FaceCheckCount++;

                        //    if (vm.FaceCheckCount == 30) {
                        //        vm.addRecordByFace(name);
                        //        vm.FaceCheckCount = 0;
                        //    }
                        //}
                        //else {
                        //    vm.FaceCheckCount = 0;
                        //    vm.FaceCheckName = name;
                        //}
                    }
                    else {
                        const context = vm.Canvas.getContext('2d');
                        context.clearRect(0, 0, vm.Canvas.width, vm.Canvas.height);
                        vm.ViewEmpSn = '';
                    }

                    setTimeout(() => vm.onPlay())
                }
                else {
                    const context = vm.Canvas.getContext('2d');
                    context.clearRect(0, 0, vm.Canvas.width, vm.Canvas.height);
                    setTimeout(() => vm.onPlay())
                }
            },


            getFace: async function () {
                console.log('getface')
                $.ajax({
                    url: vm.ClockApiPath + "Basic/GetEmpImgDetectFace",
                    type: "GET",
                    success: function (datas) {
                        vm.ImageMap = [];
                        var fil = JSON.parse(datas.Data);
                        var temp = [];
                        temp = fil;
                        for (var ob of temp) {
                            var str = JSON.parse(ob.param);
                            for (var flo of str) {
                                var desc = [];
                                for (var des of flo.descriptors) {
                                    var d = new Float32Array(des)
                                    desc.push(d);
                                }
                                vm.ImageMap.push(new faceapi.LabeledFaceDescriptors(flo.label + '---'+ob.emp_name, desc))
                            }
                        }
                        if (vm.CheckGetFaceOne == false) {
                            vm.CheckGetFaceOne = true;
                            window.setTimeout(function () {
                                vm.onPlay();
                            }, 5000);
                        }
                    },
                    error: function (msg) {

                    }
                });
                //const canvas = document.getElementById('canvas')
                //const canvas1 = document.getElementById('test')
                //const myImage = document.getElementById('myImage')

                //const context = canvas1.getContext('2d');
                //context.clearRect(0, 0, canvas1.width, canvas1.height);
                //const testFolder = './img';
                //const fs = require('fs');
                //var labels = [];

                //fs.readdirSync(testFolder).forEach(file => {
                //  // var newStr =  file.replace('.jpg', '');
                //    labels.push(file)
                //});

                // const labels = ['test']
                //const labeledFaceDescriptors = await Promise.all(
                //    labels.map(async label => {
                //        // fetch image data from urls and convert blob to HTMLImage element
                //        //const imgUrl = `${label}.jpg`
                //        const img = await faceapi.fetchImage('../img/' + label)

                //        // detect the face with the highest score in the image and compute it's landmarks and face descriptor
                //        const fullFaceDescription = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks(true).withFaceDescriptor()

                //        if (!fullFaceDescription) {
                //            return;
                //        }

                //        const faceDescriptors = [fullFaceDescription.descriptor]
                //        return new faceapi.LabeledFaceDescriptors(label.replace('.jpg', ''), faceDescriptors)
                //    })
                //)

                //var filtered = labeledFaceDescriptors.filter(function (el) {
                //    return el != null && el != undefined;
                //});
                //vm.ImageMap = filtered;

                //console.log(vm.ImageMap)


                //const results = await faceapi
                //    .detectAllFaces(myImage)
                //    .withFaceLandmarks()
                //    .withFaceDescriptors()

                //if (!results.length) {
                //    return
                //}

                //// create FaceMatcher with automatically assigned labels
                //// from the detection results for the reference image
                //const faceMatcher = new faceapi.FaceMatcher(results)

                //const singleResult = await faceapi
                //    .detectSingleFace(canvas)
                //    .withFaceLandmarks()
                //    .withFaceDescriptor()

                //if (singleResult) {
                //    const bestMatch = faceMatcher.findBestMatch(singleResult.descriptor)
                //    console.log(bestMatch)
                //}


                //const displaySize = { width: 640, height: 480 }
                //const resizedResults = faceapi.resizeResults(singleResult, displaySize)
                // draw detections into the canvas
                //faceapi.draw.drawDetections(canvas1, resizedResults)
                // draw the landmarks into the canvas
                //faceapi.draw.drawFaceLandmarks(canvas1, resizedResults)

                ///* Display face landmarks */
                //const detectionsWithLandmarks = await faceapi
                //    .detectAllFaces(canvas)
                //    .withFaceLandmarks()

                //// resize the detected boxes and landmarks in case your displayed image has a different size than the original
                //const displaySize = { width: canvas1.width, height: canvas1.height }

                //const resizedResults = faceapi.resizeResults(detectionsWithLandmarks, displaySize)
                //// draw detections into the canvas
                //faceapi.draw.drawDetections(canvas1, resizedResults)
                //// draw the landmarks into the canvas
                //faceapi.draw.drawFaceLandmarks(canvas1, resizedResults)
            },

            closeNotification: function () {
                vm.notification = false;
            },
            restartApp: function () {
                ipcRenderer.send('restart_app');
            },
            CheckUserExist: function () {
                vm.loginDialog = true;
                $.ajax({
                    url: vm.ClockApiPath + "Clock/LoginSSO?Account=" + vm.Account + "&Password=" + vm.Password,
                    type: "POST",
                    success: function (datas) {
                        var ob = JSON.parse(datas.Data);
                        if (ob.Data.Id == null) {
                            alert('帳號或密碼錯誤')
                            vm.loginDialog = false;
                            return;
                        }
                        vm.GetUserData(ob);
                    },
                    error: function (msg) {

                    }
                });
            },
            GetUserData: function (ob) {
                $.ajax({
                    url: vm.NewEIPApiPath + "System/GetUserDataByUidByApp?uid=" + ob.Data.Id,
                    type: "GET",
                    success: function (datas) {
                        var ob = datas.Data;
                        $("#cerrier").focus();

                        if (ob.department == 6) {
                            vm.CheckUser = true;
                            vm.GetCompanyGuid();
                        }
                        else {
                            alert("無權限");
                            vm.loginDialog = false;
                        }

                    },
                    error: function (msg) {

                    }
                });
            },
            GetCompanyGuid: function () {
                $.ajax({
                    url: vm.ClockApiPath + "Clock/GetCompanyGuid?company_id=" + vm.CompanyId,
                    type: "GET",
                    success: function (datas) {
                        var ob = datas.Data;
                        if (localStorage.getItem(vm.CompanyId) != ob[0]) {
                            localStorage.removeItem(vm.CompanyId);
                            if (ob.length <= 0) {
                                var guid = vm.GetGuid();
                                vm.AddCompanyGuid(guid);
                            }
                            else {
                                vm.Guid = ob[0];
                                localStorage.setItem(vm.CompanyId, ob[0]);
                            }
                        }
                        else {
                            vm.Guid = localStorage.getItem(vm.CompanyId);
                        }
                        vm.loginDialog = false;
                    },
                    error: function (msg) {

                    }
                });
            },
            GetGuid: function () {
                var d = Date.now();
                if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
                    d += performance.now(); //use high-precision timer if available
                }
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    var r = (d + Math.random() * 16) % 16 | 0;
                    d = Math.floor(d / 16);
                    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
                });
            },
            AddCompanyGuid: function (guid) {
                $.ajax({
                    url: vm.ClockApiPath + "Clock/AddCompanyGuid?company_id=" + vm.CompanyId + "&guid=" + guid,
                    type: "POST",
                    success: function (datas) {
                        localStorage.setItem(vm.CompanyId, guid);
                        vm.Guid = guid;
                    },
                    error: function (msg) {

                    }
                });
            },
            takePicture: function (ob, resultOb) {

                //var canvas = document.getElementById('canvas');
                //var ctx = canvas.getContext('2d');
                //var url = canvas.toDataURL('images/jpeg');

                var canvas = document.createElement("canvas");
                canvas.width = vm.Video.videoWidth;
                canvas.height = vm.Video.videoHeight;
                canvas.getContext('2d')
                    .drawImage(vm.Video, 0, 0, canvas.width, canvas.height);
                var url = canvas.toDataURL('images/jpeg');



                if (vm.ClockStatus == 1) {
                    vm.voiceStart(resultOb.emp_name + "早安啦");
                    vm.SuccessMsgStr = resultOb.emp_name + " : 上班打卡成功";
                    vm.SuccessEmpSn = "工號 : " + resultOb.emp_sn;
                    vm.SuccessDepName = "部門 : " + resultOb.dep_name;
                    vm.RecordList.push({
                        SuccessMsgStr: vm.SuccessMsgStr,
                        SuccessEmpSn: vm.SuccessEmpSn,
                        SuccessDepName: vm.SuccessDepName,
                        SuccessNowDate: ob.clockTime,
                        nowPic: url
                    });
                }
                else {
                    vm.voiceStart(resultOb.emp_name + "再見啦");
                    vm.SuccessMsgStr = resultOb.emp_name + ":下班打卡成功";
                    vm.SuccessEmpSn = "工號 : " + resultOb.emp_sn;
                    vm.SuccessDepName = "部門 : " + resultOb.dep_name;
                    vm.RecordList.push({
                        SuccessMsgStr: vm.SuccessMsgStr,
                        SuccessEmpSn: vm.SuccessEmpSn,
                        SuccessDepName: vm.SuccessDepName,
                        SuccessNowDate: ob.clockTime,
                        nowPic: url
                    });
                }

                vm.SuccessCount = vm.SuccessCount + 1;
                vm.SuccessMsg = true;
                var arr = url.split(','),
                    mime = arr[0].match(/:(.*?);/)[1],
                    bstr = atob(arr[1]),
                    n = bstr.length,
                    u8arr = new Uint8Array(n);

                while (n--) {
                    u8arr[n] = bstr.charCodeAt(n);
                }
                var file = new File([u8arr], resultOb.emp_name + ".jpg", { type: mime });
                vm.UploadFileList.push({
                    recordId: resultOb.recordId,
                    file: file,
                    FileName: resultOb.emp_name,
                    Clock_Status: ob.clock_status,
                    ClockTime: ob.clockTime,
                    UploadStatus: false
                });

            },
            uploadClockInOutImg: async function (UploadList) {
                for (let index in UploadList) {
                    if (vm.UploadIng == false) {
                        console.log("被Return了", vm.UploadFileList)
                        return;
                    }
                    if (UploadList[index].UploadStatus == true) {
                        continue;
                    }
                    var form = new FormData();
                    form.append("FileName", UploadList[index].FileName);
                    form.append("Clock_Status", UploadList[index].Clock_Status);
                    form.append("ClockTime", UploadList[index].ClockTime);
                    form.append("file", UploadList[index].file);


                    let myFirstPromise = await new Promise((resolve, reject) => {
                        var settings = {
                            "async": true,
                            "crossDomain": true,
                            "url": vm.UploadApiPath + "Cust/ClockInOutImgUpload",
                            "method": "POST",
                            "headers": {
                                "Cache-Control": "no-cache",
                                "Postman-Token": "3cfc2c4a-8658-f00a-662e-f8be42c64402"
                            },
                            "processData": false,
                            "contentType": false,
                            "mimeType": "multipart/form-data",
                            "data": form
                        }

                        $.ajax(settings).done(function (response) {
                            var responseOb = JSON.parse(response);
                            var ob = {
                                recordId: UploadList[index].recordId,
                                fileUrl: responseOb.Data.FileUrl
                            };
                            vm.updateRecordFileUrl(ob);
                            vm.UploadFileList[index].UploadStatus = true;
                            resolve(response);
                        });
                    }).then(function (value) {
                        console.log(value)
                    }).catch(function (rej) {

                    });
                }
            },
            changeStatus: function (i) {
                //$("#cerrier").focus();
                vm.ClockStatus = i;
                if (i == 1) {
                    vm.BtnStyle1 = "display:inline-block; width:30%;height:100%;border:inset;border-color:red;border-width:10px;";
                    vm.BtnStyle2 = "display:inline-block; width:30%;height:100%;";
                }
                if (i == 2) {
                    vm.BtnStyle1 = "display:inline-block; width:30%;height:100%;";
                    vm.BtnStyle2 = "display:inline-block; width:30%;height:100%;border:inset;border-color:red;border-width:10px;";
                }
            },
            changeDateChar: function (str) {
                if (str.toString().length == 1) {
                    str = '0' + str;
                }
                return str;
            },
            newDate: function () {
                const element = document.querySelector('#clock');
                element.addEventListener('click', function (e) {
                    if (e.path[0].id != "keyinEmpSn") {
                        $("#cerrier").focus();
                    }
                }) // 點擊之後印出
                //element.addEventListener('keypress', function (event) {
                //    if (event.keyCode == 13) {
                //        if (event.path[0].id != "cerrier") {
                //            event.preventDefault();
                //        }
                //        else {
                //        }
                //    }
                //});
                dateSetTimeOut = window.setInterval(function () {
                    var now = new Date();//生成日期物件(完整的日期資訊)
                    var y = now.getFullYear();//年份
                    var M = vm.changeDateChar(now.getMonth() + 1);//月份
                    var d = vm.changeDateChar(now.getDate());//日期
                    var h = vm.changeDateChar(now.getHours());//小時
                    var m = vm.changeDateChar(now.getMinutes());//分鐘
                    var s = vm.changeDateChar(now.getSeconds());//秒數
                    vm.nowDate = y + '-' + M + '-' + d;
                    vm.nowTime = h + ':' + m + ':' + s;
                }, 1000);

            },
            voiceStart: function (str) {
                var IsEnd = true;;
                var voicelist = responsiveVoice.getVoices();
                if (!IsEnd)
                    responsiveVoice.fallbackMode = false;

                IsEnd = false;
                responsiveVoice.speak(str, "Chinese Female", {
                    onend: function (EndCallback) {
                        IsEnd = true;
                    }
                });
            },

            addRecord: function () {
                console.log('讀卡ENTER')
                console.log('ENTER觸發');
                if (vm.Guid == "") {
                    alert('沒有guid')
                    return;
                }
                //vm.InputDis = true;
                if (vm.carrier.length != 10) {
                    //  vm.InputDis = false;
                    vm.carrier = "";
                    console.log('10碼')
                    return;
                }
                var ca = vm.carrier;
                vm.carrier = "";
                var ob = {
                    carrier: ca,
                    clockTime: vm.nowDate + " " + vm.nowTime,
                    clock_status: vm.ClockStatus,
                    imageFileLink: "",
                    token: vm.Guid
                };
                if (vm.Ing == true) {
                    console.log('執行中')
                    vm.WaitMsg = true;
                    vm.WaitMsgCount = vm.WaitMsgCount + 1;
                    return;
                }
                vm.Ing = true;

                //vm.SuccessMsg = false;
                if (vm.fullscreenLoading == true) {
                    // vm.carrier = "";
                    vm.WaitMsg = true;
                    vm.WaitMsgCount = vm.WaitMsgCount + 1;
                    return;
                }
                vm.fullscreenLoading = true;
                vm.carrier = "";

                console.log('INSERT RECORD')

                $.ajax({
                    url: vm.ClockApiPath + "Clock/AddClockRecord",
                    type: "POST",
                    data: { value: ob },
                    dataType: "json",
                    success: function (datas) {
                        vm.carrier = "";
                        vm.SuccessMsg = true;
                        vm.nowPic = "";
                        clearTimeout(setTimeOut);
                        var result = datas.Data;
                        console.log('Record Return')
                        if (result.emp_name != "無登記") {
                            console.log(vm.count)
                            vm.takePicture(ob, result);
                        }
                        else {
                            vm.close("NoData");
                        }
                    },
                    error: function (msg) {
                        vm.close("Error");
                    }
                });
            },
            addRecordByEmpSn: function () {
                console.log('工號ENTER')
                console.log('ENTER觸發');
                if (vm.Guid == "") {
                    alert('沒有guid')
                    return;
                }
                if (vm.keyinEmpSn.length != 9) {
                    vm.keyinEmpSn = "";
                    vm.LengthError = true;
                    window.setTimeout(function () {
                        vm.LengthError = false;
                    }, 2000);
                    vm.LengthError = true;
                    $("#cerrier").focus();
                    return;
                }
                var ca = vm.keyinEmpSn;
                vm.keyinEmpSn = "";
                var ob = {
                    emp_sn: ca,
                    clockTime: vm.nowDate + " " + vm.nowTime,
                    clock_status: vm.ClockStatus,
                    imageFileLink: "",
                    token: vm.Guid
                };
                if (vm.Ing == true) {
                    vm.WaitMsg = true;
                    vm.WaitMsgCount = vm.WaitMsgCount + 1;
                    return;
                }
                vm.Ing = true;

                if (vm.fullscreenLoading == true) {
                    vm.WaitMsg = true;
                    vm.WaitMsgCount = vm.WaitMsgCount + 1;
                    return;
                }
                vm.fullscreenLoading = true;

                $.ajax({
                    url: vm.ClockApiPath + "Clock/AddClockRecordByEmpSn",
                    // url: "http://localhost:58844/api/" + "Clock/AddClockRecordByEmpSn",
                    type: "POST",
                    data: { value: ob },
                    dataType: "json",
                    success: function (datas) {
                        vm.keyinEmpSn = "";
                        vm.SuccessMsg = true;
                        vm.nowPic = "";
                        clearTimeout(setTimeOut);
                        var result = datas.Data;
                        if (result.emp_name != "無登記") {
                            console.log(vm.count)
                            vm.takePicture(ob, result);
                        }
                        else {
                            vm.close("NoData");
                        }
                    },
                    error: function (msg) {
                        vm.close("Error");
                    }
                });
                return false;
            },

            addRecordByFace: function (emp_sn) {
                if (vm.FaceTopName == emp_sn) {
                    console.log('重複');
                    return;
                }
                console.log('Face ENTER')
                if (vm.Guid == "") {
                    alert('沒有guid')
                    return;
                }

                var ca = emp_sn;
                var ob = {
                    emp_sn: ca,
                    clockTime: vm.nowDate + " " + vm.nowTime,
                    clock_status: vm.ClockStatus,
                    imageFileLink: "",
                    token: vm.Guid
                };
                if (vm.Ing == true) {
                    vm.WaitMsg = true;
                    vm.WaitMsgCount = vm.WaitMsgCount + 1;
                    return;
                }
                vm.Ing = true;

                if (vm.fullscreenLoading == true) {
                    vm.WaitMsg = true;
                    vm.WaitMsgCount = vm.WaitMsgCount + 1;
                    return;
                }
                vm.fullscreenLoading = true;

                $.ajax({
                    url: vm.ClockApiPath + "Clock/AddClockRecordByEmpSn",
                    // url: "http://localhost:58844/api/" + "Clock/AddClockRecordByEmpSn",
                    type: "POST",
                    data: { value: ob },
                    dataType: "json",
                    success: function (datas) {
                        vm.FaceTopName = emp_sn;
                        vm.keyinEmpSn = "";
                        vm.SuccessMsg = true;
                        vm.nowPic = "";
                        clearTimeout(setTimeOut);
                        var result = datas.Data;
                        if (result.emp_name != "無登記") {
                            console.log(vm.count)
                            vm.takePicture(ob, result);
                        }
                        else {
                            vm.close("NoData");
                        }
                    },
                    error: function (msg) {
                        vm.close("Error");
                    }
                });
                return false;
            },

            updateRecordFileUrl: function (result) {
                $.ajax({
                    url: vm.ClockApiPath + "Clock/UpdateClockRecordFileLink?recordId=" + result.recordId + "&fileUrl=" + result.fileUrl,
                    type: "POST",
                    dataType: "json",
                    success: function (datas) {
                        //vm.SuccessCount = vm.SuccessCount + 1;
                    }
                });
            },
            close: function (type) {
                vm.nowPic = "";
                if (type == "NoData") {
                    // $("#cerrier").focus();
                    vm.SuccessMsgStr = "無效卡片,請洽詢HR開卡";
                    // vm.carrier = "";
                    vm.SuccessEmpSn = "";
                    vm.SuccessDepName = "";
                    vm.SuccessJobName = "";
                    vm.SuccessCount = vm.SuccessCount + 1;
                    vm.SuccessMsg = true;
                    vm.RecordList.push({
                        SuccessMsgStr: vm.SuccessMsgStr,
                        SuccessEmpSn: vm.SuccessEmpSn,
                        SuccessDepName: vm.SuccessDepName,
                        nowPic: ""
                    });
                    vm.fullscreenLoading = false;

                }
                if (type == "Error") {
                    $("#cerrier").focus();
                    vm.SuccessMsgStr = "失敗";
                    vm.carrier = "";
                    vm.SuccessEmpSn = "";
                    vm.SuccessDepName = "";
                    vm.SuccessJobName = "";
                    vm.SuccessMsg = true;
                    vm.SuccessCount = vm.SuccessCount + 1;
                    vm.fullscreenLoading = false;
                }
            },



        }
    });
}
