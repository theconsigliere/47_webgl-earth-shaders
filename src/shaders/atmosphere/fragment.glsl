uniform vec3 uSunDirection;
uniform vec3 uAtmosphereDayColor;
uniform vec3 uAtmosphereTwilightColor;


varying vec3 vNormal;
varying vec3 vPosition;


void main()
{
    vec3 viewDirection = normalize(vPosition - cameraPosition);
    vec3 normal = normalize(vNormal);
    vec3 color = vec3(0.0);

    // Sun orientation
   // vec3 uSunDirection = vec3(0.0, 0.0, 1.0);
    // how much of the face is orientated towards the sun
    float sunOrientation = dot(uSunDirection, normal);

    // ATMOSPHERE
    // remap the sunOrientation using a smoothstep similar to what we did with the dayMix
    float atmosphereDayMix = smoothstep(- 0.5, 1.0, sunOrientation);
    vec3 atmosphereColor = mix(uAtmosphereTwilightColor, uAtmosphereDayColor, atmosphereDayMix);
    
    color += atmosphereColor;

    // EDGE Alpha
    float edgeAlpha = dot(viewDirection, normal);
    edgeAlpha = smoothstep(0.0, 0.5, edgeAlpha);
    float dayAlpha = smoothstep(- 0.5, 0.0, sunOrientation);
    // combine alphas
    float alpha = edgeAlpha * dayAlpha;


    // Final color
    gl_FragColor = vec4(color, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}