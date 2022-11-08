from typing import Iterable
from django.http.response import HttpResponse
from django.shortcuts import render
from folium import plugins
import folium
import geocoder  # import geojson
import json, requests

import time

from . import RouteSearch
from haversine import haversine  # 거리측정

from .models import PoliceStation
from django.core import serializers

g = geocoder.ip('me')  # 현재 내위치


# Create your views here.
def home(request):
    map = folium.Map(location=g.latlng, zoom_start=15, width='100%', height='100%', )
    plugins.LocateControl().add_to(map)
    # plugins.Geocoder().add_to(map)

    maps = map._repr_html_()  # 지도를 템플릿에 삽입하기위해 iframe이 있는 문자열로 반환 (folium)
    folium.Marker(location=g.latlng).add_to(map)
    return render(request, '../templates/home.html', {'map': maps})


def saferoute(request):
    SafePath = []
    totalDistance = 0;

    startx = request.POST.get('startX')
    starty = request.POST.get('startY')
    endx = request.POST.get('endX')
    endy = request.POST.get('endY')
    start_coordinate = [starty, startx]
    end_coordinate = [endy, endx]

    # type : list(Hmap), grid(Hex), list
    Hexlist, grid, path, TileValue_map = RouteSearch.startSetting(start_coordinate, end_coordinate)
    Before_Hex = path[0]
    increase = [0, 0]  # q,r 증가율
    count = 1

    for idx, HexPoint in enumerate(path):
        if Before_Hex is not HexPoint:
            # 첫 노드 증가율 기록 - 두번째 노드
            if increase[0] == 0 and increase[1] == 0:
                x = int(HexPoint[0]) - int(Before_Hex[0])
                y = int(HexPoint[1]) - int(Before_Hex[1])
                increase = [x, y]
                Before_Hex = HexPoint

                continue
            # 증가율 비교
            else:
                x = int(HexPoint[0]) - int(Before_Hex[0])
                y = int(HexPoint[1]) - int(Before_Hex[1])
                if increase[0] == x and increase[1] == y:
                    Before_Hex = HexPoint
                    continue
                else:
                    increase = [x, y]

        # print(count,' ',HexPoint)
        count += 1
        Before_Hex = HexPoint
        geo_center = grid.hex_center(HexPoint)
        SafePath.append([geo_center.y, geo_center.x])

        if len(SafePath) > 1:
            totalDistance += haversine(SafePath[len(SafePath) - 2], SafePath[len(SafePath) - 1])
        increase = [0, 0]

    # 마지막 노드 추가
    geo_center = grid.hex_center(path[-1])
    SafePath.append([geo_center.y, geo_center.x])
    totalDistance += haversine(SafePath[len(SafePath) - 2], SafePath[len(SafePath) - 1])

    print('토탈 거리:', totalDistance)
    soc = 1 / 16
    totalTime = totalDistance // soc
    print('토탈 시간', totalTime)
    return HttpResponse(json.dumps({'result': SafePath, 'totalDistance': totalDistance, 'totalTime': totalTime}),
                        content_type="application/json");


def PathFinder(request):
    shortData = []
    SafePath = []
    SPoint = []

    # ------------------------- 최단 루트 (SPoint) -----------------------------------------
    start_coordinate = getLatLng(request.POST.get('StartAddr'))
    end_coordinate = getLatLng(request.POST.get('EndAddr'))

    # shortData = request.POST.get('shortestRoute').split(",")
    #
    # for i in shortData :
    #     if(shortData.index(i)%2==0) :
    #         lat =i; #위도
    #         lon = shortData[(shortData.index(i))+1]  #경도
    #         point=[float(lat), float(lon)]
    #         SPoint.append(point)

    # -----------------------------맵핑-----------------------------------------
    map = folium.Map(location=start_coordinate, zoom_start=15, width='100%', height='100%', )

    folium.PolyLine(locations=SPoint, weight=4, color='red').add_to(map)

    folium.Marker(
        location=start_coordinate,
        popup=request.POST.get('StartAddr'),
        icon=folium.Icon(color="red"),
    ).add_to(map)

    folium.Marker(
        location=end_coordinate,
        popup=request.POST.get('EndAddr'),
        icon=folium.Icon(color="red"),
    ).add_to(map)

    plugins.LocateControl().add_to(map)

    # ---------------------------안전 루트--------------------------------------
    # type : list(Hmap), grid(Hex), list
    Hexlist, grid, path = RouteSearch.startSetting(start_coordinate, end_coordinate)
    Before_Hex = path[0]
    increase = [0, 0]  # q,r 증가율
    count = 1
    hexcount = 1
    for idx, HexPoint in enumerate(path):
        if Before_Hex is not HexPoint:
            # 첫 노드 증가율 기록 - 두번째 노드
            if increase[0] == 0 and increase[1] == 0:
                # print('처음 incread :',increase)
                x = int(HexPoint[0]) - int(Before_Hex[0])
                y = int(HexPoint[1]) - int(Before_Hex[1])
                increase = [x, y]
                Before_Hex = HexPoint
                # print('변경 후 incread :',increase)
                print(hexcount, '-', Before_Hex, '\n')
                hexcount += 1

                continue
            # 증가율 비교
            else:
                x = int(HexPoint[0]) - int(Before_Hex[0])
                y = int(HexPoint[1]) - int(Before_Hex[1])
                if increase[0] == x and increase[1] == y:
                    Before_Hex = HexPoint
                    # print(hexcount,'-',Before_Hex,'\n')
                    hexcount += 1
                    continue
                else:
                    # print('incread :',increase)
                    increase = [x, y]
                    # print('변경 후 incread :',increase)

        print(count, ' ', HexPoint)
        count += 1
        Before_Hex = HexPoint
        # print(hexcount,'-',Before_Hex,'\n')
        hexcount += 1
        geo_center = grid.hex_center(HexPoint)
        SafePath.append([geo_center.y, geo_center.x])

        # if idx < len(path):
        #     increase=[path[idx+1][0]-HexPoint[0],path[idx+1][1]-HexPoint[1]]
        increase = [0, 0]
    folium.PolyLine(locations=SafePath, weight=4, color='blue').add_to(map)

    maps = map._repr_html_()  # 지도를 템플릿에 삽입하기위해 iframe이 있는 문자열로 반환 (folium)

    return render(request, '../templates/home.html', {'map': maps})


def GetSpotPoint(request):
    start_coordinate = getLatLng(request.POST.get('StartAddr'))
    end_coordinate = getLatLng(request.POST.get('EndAddr'))

    context = {'startaddr': start_coordinate, 'endaddr': end_coordinate}

    return HttpResponse(json.dumps(context), content_type='application/json')


def getLatLng(addr):
    url = 'https://dapi.kakao.com/v2/local/search/address.json?query=' + addr
    headers = {"Authorization": "KakaoAK 3367f3548b7ac2afc0df6f893ef0b30f"}
    result = json.loads(str(requests.get(url, headers=headers).text))
    match_first = result['documents'][0]['address']

    return float(match_first['y']), float(match_first['x'])

def getPolice(request):
    police = PoliceStation.objects.all()
    police_list = serializers.serialize('json',police)
    # print(police_list)

    return HttpResponse(police_list, content_type="text/json-comment-filtered")

def getMyPosition(request):
    count=0
    job1 = {['333', '4444']}
    # while True:
    #     print(job1)
    #     time.sleep(1)
    #     count = count + 1
    #     if count > 5:
    #         break
    #     return HttpResponse(job1, content_type="text/json-comment-filtered")
    return HttpResponse(job1, content_type="application/json")
# def getNowPosition():
#     return ['333','4444']

def intro(request):
    return render(request, '../templates/intro.html')