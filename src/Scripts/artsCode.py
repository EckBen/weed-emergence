#WV_max = 0.45    #0.38 sand 0.58 clay
bucket_depth = 36.
top_soil_bucket = 6.  ## top water bucket in inches
bottom_soil_bucket = bucket_depth-top_soil_bucket

laminar_thick = 0.003 ## 20  mm laminar layer for grass

tmax_adj = 5
intercept = .10
p = 0.3
TAW = 2*(2./3.)
drain = 0.08  
       
MC = 0.12  ##ITHACA
BD = 1.4   ##ITHACA

F = 0.5    #0.5    ## weighing factor allowed to vary between 0 and 1 0.5 is preferred (time-centered, or Crank-Nicholson schem)
G = 1.-F

C1 = 0.65 - 0.78 * BD + 0.6 * BD ** 2    #'Eq. 4.27'
C2 = 1.06 * BD                          #'Eq. 4.25'
C3 = 1 + 2.6 / (MC)**0.5                 # 'Eq. 4.28' water content where thermal conductivity begins to increase rapidly
C4 = 0.3 + 0.1 * BD ** 2                 #'Eq. 4.22'  h of dry materials 

SL = 24   ## send this routine only 1 day of data
M = 14    #13   13 soil nodes plus one node pfr laminar air layer at surface
DT = 3600

Kc = 1.0

WV_max = 1-(BD/2.650)- 0.10   ###retained 10% air space

print WV_max,'WV_max'


def thermalConductivity(BD,waterContent,clay,temp):

	ga = 0.088
	thermalConductivitysolid = 2.5  #2.5
	atmPressure = 100
	
	q = 7.25*clay + 2.52
	xwo = 0.33*clay + 0.078
	
	solidContent = BD/2.650   ##Assumes particle density of 2650 Mg/m3
	porosity = 1-solidContent

	gasPorosity =  where(porosity-waterContent > 0,porosity-waterContent,0.)
	
	
	temperatureK = temp + 273.16
	Lv = 45144-48*temp
	svp = 0.611 * exp(17.502 * temp / (temp + 240.97))
	slope = 17.502 * 240.97 * svp/ (240.97 + temp)**2.0
	Dv = 0.0000212 * (101.3 / atmPressure) * (temperatureK / 273.16)**1.75
	rhoair = 44.65 * (atmPressure / 101.3) * (273.16/temperatureK)
	

	stcor = where(1-svp/atmPressure > 0.3,1-svp/atmPressure,0.3)
	
	thermalConductivitywater = 0.56 + 0.0018 * temp
	

	wf = where(waterContent< 0.01*xwo,0,1 / (1 + (waterContent / xwo)**(-q)))	

	thermalConductivitygas = (0.0242 + 0.00007 * temp + wf * Lv * rhoair * Dv * slope / (atmPressure * stcor))

	gc = 1- 2 * ga
	
	thermalConductivityfluid = (thermalConductivitygas + (thermalConductivitywater-thermalConductivitygas)*(waterContent/ porosity)**2.0)
	
	ka = (2 / (1 + (thermalConductivitygas / thermalConductivityfluid - 1) * ga ) + 1 / (1 + (thermalConductivitygas / thermalConductivityfluid - 1) * gc)) /3
	
	kw = (2 / (1 + (thermalConductivitywater / thermalConductivityfluid - 1) * ga) + 1 / (1 + (thermalConductivitywater / thermalConductivityfluid - 1) * gc)) /3
	
	ks = (2 / (1 + (thermalConductivitysolid / thermalConductivityfluid - 1) * ga) + 1 / (1 + (thermalConductivitysolid / thermalConductivityfluid - 1) * gc)) / 3
	
	thermalConductivity = ((kw * thermalConductivitywater * waterContent + ka * thermalConductivitygas * gasPorosity + ks * thermalConductivitysolid * solidContent) / (kw * waterContent + ka * gasPorosity + ks * solidContent))
	
	return thermalConductivity
	


def soil_2inch_model(TA_vals,AM_vals,WV_top,WV_bottom,TB,T):   ##changed 5/18/16 atd added TB/

	z = empty(M+2)
	z[:] = NaN
	K = copy(z)
	K_new = copy(z)
	CP=copy(z)
	A = copy(z)
	B=copy(z)
	C=copy(z)
	D=copy(z)

	inch_dict = {1:[],2:[],4:[],8:[],20:[]}
	K[:] = 0.025/laminar_thick 
	K_new[:] = 0.025/laminar_thick	
	z[0]=0    ### top of air soil column
	z[1] = laminar_thick	

	for i in range (1,M+1):
		z[i+1]=z[i]+0.005*1.5**(i-1)   ### geometric progression of soil depth nodes.  More near surface fewer at depth.
	
		if z[i-1]/0.0254<=1 and z[i]/0.0254>1:
			inch_dict[1].append((i-1,(1-(z[i-1]/0.0254))/((z[i]/0.0254)-(z[i-1]/0.0254))))
			inch_dict[1].append((i,((z[i]/0.0254)-1)/((z[i]/0.0254)-(z[i-1]/0.0254))))
		if z[i-1]/0.0254<=2 and z[i]/0.0254>2:
                        inch_dict[2].append((i-1,(2-(z[i-1]/0.0254))/((z[i]/0.0254)-(z[i-1]/0.0254))))
                        inch_dict[2].append((i,((z[i]/0.0254)-2)/((z[i]/0.0254)-(z[i-1]/0.0254))))
                if z[i-1]/0.0254<=4 and z[i]/0.0254>4:
                        inch_dict[4].append((i-1,(4-(z[i-1]/0.0254))/((z[i]/0.0254)-(z[i-1]/0.0254))))
                        inch_dict[4].append((i,((z[i]/0.0254)-4)/((z[i]/0.0254)-(z[i-1]/0.0254))))
                if z[i-1]/0.0254<=8 and z[i]/0.0254>8:
                        inch_dict[8].append((i-1,(8-(z[i-1]/0.0254))/((z[i]/0.0254)-(z[i-1]/0.0254))))
                        inch_dict[8].append((i,((z[i]/0.0254)-8)/((z[i]/0.0254)-(z[i-1]/0.0254))))
                if z[i-1]/0.0254<=20 and z[i]/0.0254>20:
                        inch_dict[20].append((i-1,(20-(z[i-1]/0.0254))/((z[i]/0.0254)-(z[i-1]/0.0254))))
                        inch_dict[20].append((i,((z[i]/0.0254)-20)/((z[i]/0.0254)-(z[i-1]/0.0254))))


	TN= copy(T)   ## initialize TN matrix to match T

#
	
#'TIME SIMULATION, HOURLY TIME STEP'

## These get initialized for each new day since only a single day is sent to function

	TI = 0
	TA = TA_vals
	AM = AM_vals
	

	for i in range (1,M+1):
		if i ==1:
			CP[i]=1010000* (z[i+1] - z[i - 1]) / (2* DT)
		elif (i>1 and i<= 9):   #  This should be the levels that encompass the 2 inch layer level 7 is at 10 cm:
			CP[i]=(2400000 * BD / 2.65 + 4180000 * WV_top + (1-(BD / 2.65)-WV_top)*1010000) * (z[i+1] - z[i - 1]) / (2* DT)    #'Eq. 4.19'
			K[i] = thermalConductivity(BD,WV_top,MC,T[i])/ (z[i + 1] - z[i])		
		
		else:   ##  for deeper layers use a constant WV that is set to the max.
			CP[i]=(2400000 * BD / 2.65 + 4180000 * WV_bottom+(1-(BD / 2.65)-WV_bottom)*1010000) * (z[i + 1] - z[i - 1]) / (2* DT)    #'Eq. 4.19'
			K[i] = thermalConductivity(BD,WV_bottom,MC,T[i]) / (z[i + 1] - z[i])

		CP[:]=CP[:]
	
	for j in range (SL):     #'Updating the time step'

		TI = TI + DT / 3600.

		TN[0] = TA + AM * math.sin(0.261799 * (TI - 6))

#    'Populating tridiagonal matrix'
		for i in range (1,M+1):
			C[i]= -K[i] * F
			A[i+1]= C[i]
			B[i] =F * (K[i-1] + K[i]) + CP[i]
			D[i] =G * K[i-1] * T[i-1] + (CP[i] - G * (K[i] + K[i-1])) * T[i] + G * K[i] * T[i+1]
#    'Setting upper and lower boundary conditions, W m-2 s-1'
		D[1] = D[1] + F * K[0] * TN[0]      #'Simplified Eq. 4.17, ignoring net radiation and latent heat transfer'
		D[M] = D[M] + K[M] * F * TN[M+1]  #'Eq. 4.15'

## round out list size

#    'Thomas algorithm'
		for i in range (1,M):
			C[i] = C[i] / B[i]
			D[i] = D[i] / B[i]
			B[i+1] = B[i+1] - A[i+1] * C[i]
			D[i+1] = D[i+1] - A[i+1] * D[i]


		TN[M] = TB

		for i in range (M-1,0,-1):
			TN[i] = D[i] - C[i] * TN[i+1]

			
#    'End Thomas algorithm'
   

		if TI == 1:
			ST_2in_avg = zeros(shape=TA_vals.shape)
			ST_1in_avg = zeros(shape=TA_vals.shape)
			ST_4in_avg = zeros(shape=TA_vals.shape)
			
			ST_avg05= zeros(shape=TA_vals.shape)
			ST_avg10= zeros(shape=TA_vals.shape)
			ST_avg25= zeros(shape=TA_vals.shape)
			ST_avg50= zeros(shape=TA_vals.shape)
			ST_avg1= zeros(shape=TA_vals.shape)

		ST_1in_avg = ST_1in_avg + inch_dict[1][0][1]*TN[inch_dict[1][0][0]]+ inch_dict[1][1][1]*TN[inch_dict[1][1][0]]   ## for 1 inch
		ST_2in_avg = ST_2in_avg + inch_dict[2][0][1]*TN[inch_dict[2][0][0]]+ inch_dict[2][1][1]*TN[inch_dict[2][1][0]]   ## for 2 inches
		ST_4in_avg = ST_4in_avg + inch_dict[4][0][1]*TN[inch_dict[4][0][0]]+ inch_dict[4][1][1]*TN[inch_dict[4][1][0]]   ## for 4 inches

		ST_avg05 = ST_avg05 + TN[2]
		ST_avg10 = ST_avg10 + TN[7]	
		ST_avg25 = ST_avg25 + TN[9]
		ST_avg50 = ST_avg50 + TN[11]
	 	ST_avg1 = ST_avg1 + TN[13]

#    'Update the temperatures and print temperature every time step

#            'Update soil temperature profile'
		for i in range(M+1):
			T[i] = TN[i]

	print WV_top,WV_bottom
	
	return TN, ST_1in_avg/(24.),ST_2in_avg/(24.),ST_4in_avg/(24.),WV_top,WV_bottom


import math
from numpy import *

import datetime
import sys, urllib, urllib2

try :
   import json 
except ImportError :
   import simplejson as json

import matplotlib.pyplot as plt

today=datetime.datetime.now()
#print today

TB = 20.   ##set deep temperature to a fixed value of 20C


for year in range(2016,2017):

	today_tup = (year,10,31)


	sdate_tup = (year,02,27)

	sdate = datetime.datetime(sdate_tup[0],sdate_tup[1],sdate_tup[2])

	today = datetime.datetime(today_tup[0],today_tup[1],today_tup[2])

	num_days = (today-sdate).days


	grid_id = 'nrcc-model'

	date = []

	coords = (42.5200,-76.3332,'Freeville')

	et_lat = coords[0]
	et_lon = coords[1]

	box_bound = str(et_lon+0.0001)+','+str(et_lat-0.0001)+','+str(et_lon-0.0001)+','+str(et_lat+0.0001)  #'-75.4549,38.6360,-75.4551,38.6362'   #Georgetown, DE
 
	url_string = 'http://tools.climatesmartfarming.org/irrigationtool/datahdf5/?callback=jQuery&lat=' + str(et_lat) + '&lon='+ str(et_lon) + '&year=' + str(today.year) +  '&format=json'
	response = urllib2.urlopen(url_string)

	data_et = json.loads(response.read()[7:-2]) # assigns array to a variable

	if data_et.keys().count('pet') <>0:
		et_data = data_et['pet'] # data is value of key "u'smry'"
	else:
		et_data = []


	print 'got ET'

	if num_days >= len(et_data): num_days = len(et_data)-1


##changed 5/18/16 atd added TB

	depth_profile = empty(M+2)
	depth_profile[:] = TB

	WV_top = 0.
	WV_bottom = copy(WV_top)

	WV_top = WV_top+WV_max*top_soil_bucket   ### total water in top 6 inches
	WV_bottom = WV_bottom+WV_max*bottom_soil_bucket   #### total water in next 30 inches (from 6 inch down to 36 inch level)
#####end of 5/18/16 change to add TB

	input_dict = {"loc":str(et_lon)+','+str(et_lat),"sdate":str(sdate.year)+'%02d'%(sdate.month)+'%02d'%(sdate.day),"edate": str(today.year)+'%02d'%(today.month)+'%02d'%(today.day),"grid":grid_id,"elems":[{"name":"maxt"},{"name":"mint"},{"name":"pcpn"}]}
	req = urllib2.Request('http://grid2.rcc-acis.org/GridData', json.dumps(input_dict), {'Accept':'application/json'})

	response = urllib2.urlopen(req)
	data_vals = json.loads(response.read())	

	for each_day in range(num_days+1):

		new_date = sdate+datetime.timedelta(days= +each_day)
	
		t_max=array(data_vals['data'][each_day][1])+tmax_adj
		t_min=array(data_vals['data'][each_day][2])
		pcp_vals=array(data_vals['data'][each_day][3])
	
	### To correct grid bias for testing at specific location
	

		t_max=(t_max-32.)*(5./9.)	
		t_min=(t_min-32.)*(5./9.)
	
		TA_vals = (t_max + t_min)/2.
		AM_vals = (t_max - t_min)
	
	####  Create TB grid with all values = 20. and same shape as ACIS grid  #####
		date.append(data_vals['data'][each_day][0])
		
	
		et_day = et_data[each_day]
		et_in=float(et_day)*Kc   #kc is crop coefficient

	
		deficit_in = -1*(average(WV_top)-WV_max*top_soil_bucket)


		if deficit_in <=(p*TAW):
			Ks = 1.
		else:
			Ks = (TAW-deficit_in)/((1-p)*TAW)

		Ks = max(Ks,0)


		pcp_vals = where(pcp_vals<=intercept,0.0,pcp_vals-intercept)

		WV_top = WV_top-(et_in*Ks)+pcp_vals


	
 		if WV_top< 0:
			WV_bottom = WV_bottom+WV_top
		else:
			WV_bottom = WV_bottom
		

		if WV_top>WV_max*top_soil_bucket:
			WV_bottom = WV_bottom+(WV_top-WV_max*top_soil_bucket)


		if WV_top < 0.05: WV_top=0.05*top_soil_bucket

		if WV_top> WV_max*top_soil_bucket : WV_top=WV_max*top_soil_bucket
		if WV_bottom > WV_max*bottom_soil_bucket:
			WV_bottom = WV_max*bottom_soil_bucket
	
		if WV_bottom <0:
			WV_bottom = 0.01


		print new_date,pcp_vals,WV_top,WV_bottom

#		print new_date,TA_vals,AM_vals,WV_top/top_soil_bucket,WV_bottom/bottom_soil_bucket,TB,depth_profile

	### really only need depth_profile,WV_top,WV_bottom  to come back.  Other variables are my diagnostics.

		print new_date,TA_vals,AM_vals,WV_top/top_soil_bucket,WV_bottom/bottom_soil_bucket,TB
	
		depth_profile,one_inch_soil,two_inch_soil,four_inch_soil,WV_top,WV_bottom = soil_2inch_model(TA_vals,AM_vals,WV_top/top_soil_bucket,WV_bottom/bottom_soil_bucket,TB,depth_profile)   ##changed 5/18/16 atd added TB	

		WV_top = WV_top*top_soil_bucket
		WV_bottom = WV_bottom*bottom_soil_bucket

		print new_date,((9./5.)*one_inch_soil+32)-50,((9./5.)*two_inch_soil+32)-50,((9./5.)*four_inch_soil+32)-50,WV_top/top_soil_bucket,WV_bottom/bottom_soil_bucket,TB
