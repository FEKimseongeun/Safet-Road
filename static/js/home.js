"use strict"
let latitude=0;
let longitude=0;
var leaf_map;
var start_markers;
var end_markers;
var short_line;
var safe_line;
var policeButton = document.getElementById("police-btn");
var policeMarker;
var policeMarkerList = [];
var policeMarkers;
var click = false;
var gps_use = null; //gps의 사용가능 여부
var gps_lat = null; // 위도
var gps_lng = null; // 경도
var gps_position; // gps 위치 객체

$(document).ready(function(){
    $('.route-wrap').hide()
    getLocation().then(location => {
        latitude =location['latitude']
        longitude = location['longitude'];
    }).then((arg) =>{
        leaf_map=L.map('map').setView([latitude, longitude],15)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom: 18}).addTo(leaf_map);    //tileLayer의 {s}는 서버 도메인 , {z},{x},{y}는 타일 지도의 위치, addTo 매소드로 map에 타일 지도를 추가
        L.control.locate({
            position: 'topleft',
            strings: {
                title: "Show me where I am, yo!"
            }
        }).addTo(leaf_map);

        
        
    });
})
// gps가 이용가능한지 체크하는 함수이며, 이용가능하다면 show location 함수를 불러온다.
// 만약 작동되지 않는다면 경고창을 띄우고, 에러가 있다면 errorHandler 함수를 불러온다.
// timeout을 통해 시간제한을 둔다.
function gps_check(){
    if (navigator.geolocation) {
        var options = {timeout:60000};
        navigator.geolocation.getCurrentPosition(showLocation, errorHandler, options);
    } else {
        alert("GPS_추적이 불가합니다.");
        gps_use = false;
    }
}


// gps 이용 가능 시, 위도와 경도를 반환하는 showlocation함수.
function showLocation(position) {
    gps_use = true;
    gps_lat = position.coords.latitude;
    gps_lng = position.coords.longitude;
}


// error발생 시 에러의 종류를 알려주는 함수.
function errorHandler(error) {
    if(error.code == 1) {
        alert("접근차단");
    } else if( err.code == 2) {
        alert("위치를 반환할 수 없습니다.");
    }
    gps_use = false;
}
function gps_tracking(){
    if (gps_use) {
        map.panTo(new kakao.maps.LatLng(gps_lat,gps_lng));
        var gps_content = '<div><img class="pulse" draggable="false" unselectable="on" src="https://ssl.pstatic.net/static/maps/m/pin_rd.png" alt=""></div>';
        var currentOverlay = new kakao.maps.CustomOverlay({
            position: new kakao.maps.LatLng(gps_lat,gps_lng),
            content: gps_content,
            map: map
        });
        currentOverlay.setMap(map);
    } else {
      alert("접근차단하신 경우 새로고침, 아닌 경우 잠시만 기다려주세요.");
      gps_check();
    }
}

//클릭 마커 찍기
function getmarker(){
    leaf_map.addEventListener('click', function(e) {
        console.log(e.latlng.lat,e.latlng.lng);
        L.marker([e.latlng.lat,e.latlng.lng]).addTo(leaf_map);
    })
    $('#StartAddr').text(e.latlng.lat+' '+e.latlng.lng);
    $('#StartAddr').disabled();
}
// 현재의 위치 정보를 가져온다.
function getLocation() {
    return new Promise(resolve => {
        navigator.geolocation.watchPosition(function(position) {
            return resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
            });
        });
    });
}

//csrf token
function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

var csrftoken = getCookie('csrftoken');

var shortestRoute=[];   //최단거리 좌표 정보
var safeRoute=[];

var input = document.getElementById("StartAddr");
input.onclick  = function(){
    new daum.Postcode({
        oncomplete: function(data) {
            // 팝업에서 검색결과 항목을 클릭했을때 실행할 코드를 작성하는 부분입니다.

            // 도로명 주소의 노출 규칙에 따라 주소를 표시한다.
            // 내려오는 변수가 값이 없는 경우엔 공백('')값을 가지므로, 이를 참고하여 분기 한다.
            var roadAddr = data.roadAddress; // 도로명 주소 변수
            var extraRoadAddr = ''; // 참고 항목 변수

            // 법정동명이 있을 경우 추가한다. (법정리는 제외)
            // 법정동의 경우 마지막 문자가 "동/로/가"로 끝난다.
            if(data.bname !== '' && /[동|로|가]$/g.test(data.bname)){
                extraRoadAddr += data.bname;
            }
            // 건물명이 있고, 공동주택일 경우 추가한다.
            if(data.buildingName !== '' && data.apartment === 'Y'){
               extraRoadAddr += (extraRoadAddr !== '' ? ', ' + data.buildingName : data.buildingName);
            }
            // 표시할 참고항목이 있을 경우, 괄호까지 추가한 최종 문자열을 만든다.
            if(extraRoadAddr !== ''){
                extraRoadAddr = ' (' + extraRoadAddr + ')';
            }

            // 우편번호와 주소 정보를 해당 필드에 넣는다.
            // document.getElementById('sample4_postcode').value = data.zonecode;
            // document.getElementById("sample4_roadAddress").value = roadAddr;
            // document.getElementById("sample4_jibunAddress").value = data.jibunAddress;
            document.getElementById("StartAddr").value = roadAddr;
        }
    }).open();
};


var output = document.getElementById("EndAddr");
output.onclick = function(){
    new daum.Postcode({
        oncomplete: function(data) {
            var roadAddr = data.roadAddress; // 도로명 주소 변수
            var extraRoadAddr = ''; // 참고 항목 변수

            if(data.bname !== '' && /[동|로|가]$/g.test(data.bname)){
                extraRoadAddr += data.bname;
            }
            if(data.buildingName !== '' && data.apartment === 'Y'){
               extraRoadAddr += (extraRoadAddr !== '' ? ', ' + data.buildingName : data.buildingName);
            }
            if(extraRoadAddr !== ''){
                extraRoadAddr = ' (' + extraRoadAddr + ')';
            }

            //set value 도로명 주소
            document.getElementById("EndAddr").value = roadAddr;
        }
    }).open();
};

// //길찾기 버튼 클릭
$("#find_botton").click(function(){
    shortestRoute=[]    //초기화
    safeRoute=[]

    var resultArray=[]; //출발지, 목적지 좌표

    //출발지 목적지 주소 -> 좌표변환
    new Promise((succ, fail) =>{
        $.ajax({
            type:'POST',
            url : setpointpage,

            data:{
                'StartAddr' : $('#StartAddr').val(),
                'EndAddr' : $('#EndAddr').val(),
                'csrfmiddlewaretoken':  csrftoken,
            },

            success : (result) => {
                resultArray=result;
                console.log(resultArray)
                succ(result);  //성공하면 검색결과 처리
            },
            fail: (error) => {
                console.log(error);
                fail(error);
            }
        });
    //resultArray : startaddr, endaddr 좌표
    }).then((arg) =>{
        console.log('좌표변환후 최단거리 실행');
        $.ajax({
            method : "POST",
            url : "https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1&format=json&callback=result",
            data : {
                "appKey" : "l7xxae6130012d7f4fb49a13108d34bd1ced",
                "startX" : resultArray['startaddr'][1],
                "startY" :resultArray['startaddr'][0],
                "endX" :resultArray['endaddr'][1],
                "endY" :resultArray['endaddr'][0],
                "reqCoordType" : "WGS84GEO",
                "resCoordType" : "EPSG3857",
                "startName" : "출발지",
                "endName" : "도착지"
            },
            success: (result) => {
                var resultData = result.features;       //출발지부터 목적지까지 경로좌표들(Point, Line)
                //결과 출력
				var tDistance = "총 거리 : "+ ((resultData[0].properties.totalDistance) / 1000).toFixed(1) + "km";
                var tTime = " 총 시간 : "+ ((resultData[0].properties.totalTime) / 60).toFixed(0) + "분";
                console.log(tDistance+" "+tTime);

                $('#short-route').text(tDistance)
                $('#short-time').text(tTime)

                for ( var i in resultData) { //for문 [S]
                    var geometry = resultData[i].geometry;  //좌표정보 ()

                    if (geometry.type == "LineString") {

                        for ( var j in geometry.coordinates) {
                            // 경로들의 결과값(구간)들을 포인트 객체로 변환
                            var latlng = new Tmapv2.Point(geometry.coordinates[j][0], geometry.coordinates[j][1]);

                            // 포인트 객체를 받아 좌표값으로 변환
                            var convertPoint = new Tmapv2.Projection.convertEPSG3857ToWGS84GEO(latlng);
                            // 포인트객체의 정보로 좌표값 변환 객체로 저장
                            var convertChange = new Tmapv2.LatLng(convertPoint._lat,convertPoint._lng);
                            // 배열에 담기
                            shortestRoute.push([convertChange['_lat'],convertChange['_lng']]);
                        }
                    }
                }
                console.log('최단경로',shortestRoute);
            },
            fail: (error) => {
                console.log(error);
            }
        })
            $.ajax({
            method : "POST",
            url : saferoute,
            raditional : true,
            data : {
                "startX" : resultArray['startaddr'][1],
                "startY" :resultArray['startaddr'][0],
                "endX" :resultArray['endaddr'][1],
                "endY" :resultArray['endaddr'][0],
                // 'csrfmiddlewaretoken':  csrftoken,
            },
            success: (response) => {
                console.log("성공")
                safeRoute = response['result']
                var safeDistance = "총 거리 : "+ (response['totalDistance']).toFixed(1) + "km";
                var safeTime = " 총 시간 : "+ (response['totalTime']).toFixed(0) + "분";

                $('#safe-route').text(safeDistance)
                $('#safe-time').text(safeTime)

                $('.route-wrap').show();
                console.log(safeRoute);
                console.log('최단경로',shortestRoute);
            },
            fail: (error) => {
                console.log(error);
            }
        })
        .then((arg) =>{
            // mapping safe

            // markers.L.clearLayers();
            // line.L.clearLayers();

            if(start_markers != undefined){
                leaf_map.removeLayer(end_markers);
                leaf_map.removeLayer(start_markers)
            }
            if(short_line!= undefined){
                leaf_map.removeLayer(short_line);
                leaf_map.removeLayer(safe_line);
            }


            leaf_map.setView([resultArray['startaddr'][0],resultArray['startaddr'][1]],16)

            start_markers=L.marker([resultArray['startaddr'][0],resultArray['startaddr'][1]]).addTo(leaf_map);
            end_markers=L.marker([resultArray['endaddr'][0],resultArray['endaddr'][1]]).addTo(leaf_map);


            //최단 route
            short_line = L.polyline(shortestRoute,{
                color: "red",
                weight: 3
            }).addTo(leaf_map);

            //안전 route
            safe_line = L.polyline(safeRoute,{
                color: "green",
                weight: 3
            }).addTo(leaf_map);
        });
        //안전경로

    });
});

policeButton.addEventListener('click', (event) => {
    if(click==false){
        console.log(click);
        $.ajax({
        url: 'getPolice',
        dataType: "json",
        success: function(data){
            for(var i=0; i<data.length; i++){
                var lat = data[i].fields.lat;
                var lon = data[i].fields.lon;
                console.log(lat,lon);
                policeMarker = L.marker([lat, lon]);
                policeMarkerList.push(policeMarker);
                policeMarkers = policeMarker.addTo(leaf_map);
            }
        }
    })
    click = true;
    }
    else if(click == true) {
        console.log(click);

        for(var i = 0; i < policeMarkerList.length; i++) {
            leaf_map.removeLayer(policeMarkerList[i]);
        }

        click = false;
    }
});

