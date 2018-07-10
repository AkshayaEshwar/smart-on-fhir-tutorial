(function(window){
  window.extractData = function() {
    var ret = $.Deferred();

    function onError() {
      console.log('Loading error', arguments);
      ret.reject();
    }
    function onReady(smart)  {
      if (smart.hasOwnProperty('patient')) {
       // var user=user.read();
      //getting the FHIR server url
      var url = smart.server.serviceUrl;
      //getting the access token
      var token = smart.server.auth.token;
        var arr=token.split('.');
        var head = arr[0];
        var load = arr[1];
        //getting the id token(response token)
       var idtoken=smart.tokenResponse.id_token;
       //var accesstoken=smart.server.access.token;
       var array = idtoken.split('.');
       var header = window.atob(array[0]);
       var payload = window.atob(array[1]);
       var res = header + payload;
       var obj1 = JSON.parse(payload);
        var text="Bearer "+token;
    // document.getElementById("demo").innerHTML = obj1.name + ", " + obj.sub + "," + obj.profile
         var settings = {
               "async": true,
               "crossDomain": true,
               "url": obj1.fhirUser,
               "method": "GET",
               "headers": {
                   "Accept": "application/json+fhir",
                   "header": head,
                   "Authorization": text,
                   "Cache-Control": "no-cache",
                  // "Postman-Token": "9f1488d2-1096-4acf-b052-bb1721519dfd"
               }
           }
           var id;
           $.ajax(settings).done(function (response) {
               console.log(response);
             console.log(smart.tokenResponse);
             console.log(smart.server.auth.token);
             id=response.id;
           });
        var patient = smart.patient;
        var pt = patient.read();
        var obv = smart.patient.api.fetchAll({
                    type: 'Observation',
                    query: {
                      code: {
                        $or: ['http://loinc.org|8302-2', 'http://loinc.org|8462-4',
                              'http://loinc.org|8480-6', 'http://loinc.org|2085-9',
                              'http://loinc.org|2089-1', 'http://loinc.org|55284-4']
                      }
                    }
                  });

        $.when(pt, obv).fail(onError);

        $.when(pt, obv).done(function(patient, obv) {
          var byCodes = smart.byCodes(obv, 'code');
          var gender = patient.gender;

          var fname = '';
          var lname = '';
         // var obj = {};
         // obj.username = smart.tokenResponse.username;
          if (typeof patient.name[0] !== 'undefined') {
            fname = patient.name[0].given.join(' ');
            lname = patient.name[0].family.join(' ');
          }

          var height = byCodes('8302-2');
          var systolicbp = getBloodPressureValue(byCodes('55284-4'),'8480-6');
          var diastolicbp = getBloodPressureValue(byCodes('55284-4'),'8462-4');
          var hdl = byCodes('2085-9');
          var ldl = byCodes('2089-1');

          var p = defaultPatient();
          p.birthdate = patient.birthDate;
          p.gender = gender;
          p.fname = fname;
          p.lname = lname;
          p.height = getQuantityValueAndUnit(height[0]);
         
          if (typeof systolicbp != 'undefined')  {
            p.systolicbp = systolicbp;
          }

          if (typeof diastolicbp != 'undefined') {
            p.diastolicbp = diastolicbp;
          }

          p.hdl = getQuantityValueAndUnit(hdl[0]);
          p.ldl = getQuantityValueAndUnit(ldl[0]);
          p.name=obj1.name;
          p.id=id;
          p.email=obj1.email;
          ret.resolve(p);
        });
      } else {
        onError();
      }
    }

    FHIR.oauth2.ready(onReady, onError);
    return ret.promise();

  };

  function defaultPatient(){
    return {
      fname: {value: ''},
      lname: {value: ''},
      gender: {value: ''},
      birthdate: {value: ''},
      height: {value: ''},
      systolicbp: {value: ''},
      diastolicbp: {value: ''},
      ldl: {value: ''},
      hdl: {value: ''},
      name:{value: ''},
      id:{value: ''},
      email:{value: ''},
    };
  }

  function getBloodPressureValue(BPObservations, typeOfPressure) {
    var formattedBPObservations = [];
    BPObservations.forEach(function(observation){
      var BP = observation.component.find(function(component){
        return component.code.coding.find(function(coding) {
          return coding.code == typeOfPressure;
        });
      });
      if (BP) {
        observation.valueQuantity = BP.valueQuantity;
        formattedBPObservations.push(observation);
      }
    });

    return getQuantityValueAndUnit(formattedBPObservations[0]);
  }

  function getQuantityValueAndUnit(ob) {
    if (typeof ob != 'undefined' &&
        typeof ob.valueQuantity != 'undefined' &&
        typeof ob.valueQuantity.value != 'undefined' &&
        typeof ob.valueQuantity.unit != 'undefined') {
          return ob.valueQuantity.value + ' ' + ob.valueQuantity.unit;
    } else {
      return undefined;
    }
  }

  window.drawVisualization = function(p){
    $('#holder').show();
    $('#loading').hide();
    $('#fname').html(p.fname);
    $('#lname').html(p.lname);
    $('#gender').html(p.gender);
    $('#birthdate').html(p.birthdate);
    $('#height').html(p.height);
    $('#systolicbp').html(p.systolicbp);
    $('#diastolicbp').html(p.diastolicbp);
    $('#ldl').html(p.ldl);
    $('#hdl').html(p.hdl);
    $('#name').html(p.name);
    $('#id').html(p.id);
    $('#email').html(p.email);
  };
 
})(window);
