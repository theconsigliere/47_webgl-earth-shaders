uniform sampler2D uDayTexture;
uniform sampler2D uNightTexture;
uniform sampler2D uSpecularCloudsTexture;
uniform float uAmountOfClouds;
uniform vec3 uSunDirection;
uniform vec3 uTime;

uniform vec3 uAtmosphereDayColor;
uniform vec3 uAtmosphereTwilightColor;

varying vec2 vUv;
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

    // Day / night texture color

    // rempa sunOrientation to 0-1 an duse smoothstep to smooth the transition
    float dayMix = smoothstep(- 0.25, 0.5, sunOrientation);
    vec3 dayColor = texture(uDayTexture, vUv).rgb;
    vec3 nightColor = texture(uNightTexture, vUv).rgb;
    // map the sun orientation to the day / night texture
    color = mix(nightColor, dayColor, dayMix);


    //CLOUDS
    // pick the specular color from the clouds texture just the rg channels
    vec2 specularCloudColor = texture(uSpecularCloudsTexture, vUv).rg;
    // We are going to create white clouds by mixing the initial color with a vec3(1.0) according to the green channel of the specularCloudColor.
    float cloudsMix = smoothstep(uAmountOfClouds, 1.0, specularCloudColor.g);
    // Hide clouds on dark side of the planet
    cloudsMix *= dayMix;
    // mix the color with white clouds
    color = mix(color, vec3(1.0), cloudsMix);


     // ATMOSPHERE
     // remap the sunOrientation using a smoothstep similar to what we did with the dayMix
     float atmosphereDayMix = smoothstep(- 0.5, 1.0, sunOrientation);
     vec3 atmosphereColor = mix(uAtmosphereTwilightColor, uAtmosphereDayColor, atmosphereDayMix);
    
     // Fresnel tmosphere is more visible on the edges of the planet. 
     float fresnel = dot(viewDirection, normal) + 1.0;
     // push fresnel on the edges
     fresnel = pow(fresnel, 4.0);
     
    // the atmosphere is way too visible on the night side of the Earth. Fortunately, we already have a variable lowering as it transitions to the night and that’s the atmosphereDayMix. Multiply the fresnel by atmosphereDayMix in the mix:
    color = mix(color, atmosphereColor, fresnel * atmosphereDayMix);


    // REFLECTION OF SUN
    // Specular
    vec3 reflection = reflect(- uSunDirection, normal);
    float specular = - dot(reflection, viewDirection);
    // CLAMP SPECULAR
    specular = max(specular, 0.0);
    specular = pow(specular, 30.0);
    // REMOVE REFLECTION ON COUNTRIES JUST THE SEA
    specular *= specularCloudColor.r;

    // We want the specular to have the color of atmosphereColor, but only when that specular is on the edges. You guessed it, we need the fresnel.
     vec3 specularColor = mix(vec3(1.0), atmosphereColor, fresnel);
    color += specular * specularColor;

    // Final color
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
