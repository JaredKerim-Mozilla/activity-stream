/* globals XPCOMUtils, Task, PlacesUtils, Services */
"use strict";

const {Ci, Cu, components} = require("chrome");

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/Task.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "PlacesUtils",
  "resource://gre/modules/PlacesUtils.jsm");

const PlacesTestUtils = Object.freeze({
  /**
   * Asynchronously adds visits to a page.
   *
   * @param {nsIURI} placeInfo
   *        Can be an nsIURI, in such a case a single LINK visit will be added.
   *        Otherwise can be an object describing the visit to add, or an array
   *        of these objects:
   *          { uri: nsIURI of the page,
   *            [optional] transition: one of the TRANSITION_* from nsINavHistoryService,
   *            [optional] title: title of the page,
   *            [optional] visitDate: visit date in microseconds from the epoch
   *            [optional] referrer: nsIURI of the referrer for this visit
   *          }
   *
   * @return {Promise}
   *            resolves When all visits have been added successfully.
   *            rejects JavaScript exception.
   */
  addVisits: Task.async(function*(placeInfo) {
    let promise = new Promise((resolve, reject) => {
      let places = [];
      if (placeInfo instanceof Ci.nsIURI) {
        places.push({uri: placeInfo});
      } else if (Array.isArray(placeInfo)) {
        places = places.concat(placeInfo);
      } else {
        places.push(placeInfo);
      }

      // Create mozIVisitInfo for each entry.
      let now = Date.now();
      for (let place of places) {
        if (typeof place.title != "string") {
          place.title = "test visit for " + place.uri.spec;
        }
        place.visits = [{
          transitionType: place.transition === undefined ? Ci.nsINavHistoryService.TRANSITION_LINK
                                                             : place.transition,
          visitDate: place.visitDate || (now++) * 1000,
          referrerURI: place.referrer
        }];
      }

      PlacesUtils.asyncHistory.updatePlaces(
        places,
        {
          handleError: function AAV_handleError(resultCode, placeInfo) { // eslint-disable-line no-unused-vars
            let ex = new components.Exception("Unexpected error in adding visits.",
                                              resultCode);
            reject(ex);
          },
          handleResult: function() {},
          handleCompletion: function UP_handleCompletion() {
            resolve();
          }
        }
      );
    });
    return (yield promise);
  }),

  /**
   * Clear all history.
   *
   * @return {Promise}
   *            resolves When history was cleared successfully.
   *            rejects JavaScript exception.
   */
  clearHistory() {
    let expirationFinished = new Promise(resolve => {
      Services.obs.addObserver(function observe(subj, topic, data) { // eslint-disable-line no-unused-vars
        Services.obs.removeObserver(observe, topic);
        resolve();
      }, PlacesUtils.TOPIC_EXPIRATION_FINISHED, false);
    });

    return Promise.all([expirationFinished, PlacesUtils.history.clear()]);
  },
});

exports.PlacesTestUtils = PlacesTestUtils;
