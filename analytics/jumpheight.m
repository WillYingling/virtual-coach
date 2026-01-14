graphics_toolkit("gnuplot");

G = -9.8;
Pj = 3;
Pb = Pj / 10;

Tdelta = 1/60;
Tj = 0:Tdelta:Pj;
Tb = 0:Tdelta:Pb;
T = [Tj, Tb+Pj];
CYCLETIME=Pj+Pb

Vj = (G*Tj) - G*(Pj/2);

figure
plot(Tj, Vj)
title("Jump Velocity") % Add a title

Hj = (G/2)*(Tj.^2) - ( ((G*Pj)/2).*Tj);

##figure
##plot(Tj, Hj)
##title("Jump Height")

#                 / -G*Pj/2
#         ______/____
#             /
#           /
# G * Pj/2
landingVelocity = G * (Pj/2);
takeOffVelocity = -landingVelocity;
bounceAcceleration = (takeOffVelocity - landingVelocity) / Pb;
Vb = (bounceAcceleration * Tb) + landingVelocity;

figure
plot(Tb, Vb)
title("Bounce Velocity")

V = [Vj, Vb]

figure
plot(T, V)
title("Velocity");

Hb = ((bounceAcceleration / 2) ) * (Tb.^2) + (landingVelocity * Tb);

figure
plot(Tb, Hb)
title("Bounce Height")

H = [Hj, Hb];

figure
plot(T, H)
title("Height")

##cycles = 2;
##Tcycles = 0:Tdelta:CYCLETIME*cycles;
##
##plot(Tcycles, repmat(H, 1, cycles));
