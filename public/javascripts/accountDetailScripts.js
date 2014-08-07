/**
 * Custom Scripts for NOC Portal Detail Pages
 */
jQuery(document).ready(function($) {
  $('.expandable p').expander({});
  document.title = "Varrow NOC Portal: " + accountName;
  tableColorConditions();
  hideAlertBox();
  $('#tabs').click(function(e) {
    e.preventDefault();
    $(this).tab('show');
  })
});

/**
 * Hides the alert box that warns if there are no active vCare entitlements
 * Including Varrow Managed Cloud
 */
function hideAlertBox() {
  var vcare = "VCARE";
  var varrow = "VARROW";

  for (i = 0; i < entName.length; i++) {
    var name = entName[i].toUpperCase();
    if ((name.indexOf(vcare) > -1) || (name.indexOf(varrow) > -1)) {
      document.getElementById("alertbox").style.display = "none";
    }
  }
}

/**
 * tableColorConditions
 * Highlights entitlement table td green if incidents remaining >= 25% incidents purchased
 * Highlights entitlement table td yellow if incidents remaining < 25% incidents purchased
 * Highlights entitlement table td red if 0 incidents remaining
 */
function tableColorConditions() {
  for (var i = 0; i < count; i++) {
    if (incidentsRem[i] == 0.0) {
      document.getElementById("incidents" + i).className = 'danger';
    } else {
      if ((incidentsRem[i] / incidentsPur[i]) >= 0.25) {
        document.getElementById("incidents" + i).className = 'success';
      } else {
        document.getElementById("incidents" + i).className = 'warning';
      }
    }
    if (BOHRem[i] == 0.0) {
      document.getElementById("BOH" + i).className = 'danger';
    } else {
      if ((BOHRem[i] / BOHPur[i]) >= 0.25) {
        document.getElementById("BOH" + i).className = 'success';
      } else {
        document.getElementById("BOH" + i).className = 'warning';
      }
    }

    if (vBOHRem[i] == 0) {
      document.getElementById("vBOH" + i).className = 'danger';
    } else {
      if ((vBOHRem[i] / vBOHPur[i]) >= 0.25) {
        document.getElementById("vBOH" + i).className = 'success';
      } else {
        document.getElementById("vBOH" + i).className = 'warning';
      }
    }
  }
}