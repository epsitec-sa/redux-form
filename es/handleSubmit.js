import _extends from "@babel/runtime/helpers/extends";
import isPromise from 'is-promise';
import SubmissionError from './SubmissionError';

var isSubmissionError = function isSubmissionError(error) {
  return error && error.name === SubmissionError.name;
};

var mergeErrors = function mergeErrors(_ref) {
  var asyncErrors = _ref.asyncErrors,
      syncErrors = _ref.syncErrors;
  return asyncErrors && typeof asyncErrors.merge === 'function' ? asyncErrors.merge(syncErrors).toJS() : _extends({}, asyncErrors, syncErrors);
};

var handleSubmit = function handleSubmit(submit, props, valid, asyncValidate, fields) {
  var dispatch = props.dispatch,
      onSubmitFail = props.onSubmitFail,
      onSubmitSuccess = props.onSubmitSuccess,
      startSubmit = props.startSubmit,
      stopSubmit = props.stopSubmit,
      setSubmitFailed = props.setSubmitFailed,
      setSubmitSucceeded = props.setSubmitSucceeded,
      syncErrors = props.syncErrors,
      asyncErrors = props.asyncErrors,
      touch = props.touch,
      values = props.values,
      persistentSubmitErrors = props.persistentSubmitErrors;
  touch.apply(void 0, Array.from(fields)); // mark all fields as touched

  if (valid || persistentSubmitErrors) {
    var doSubmit = function doSubmit() {
      var result;

      try {
        result = submit(values, dispatch, props);
      } catch (submitError) {
        var error = isSubmissionError(submitError) ? submitError.errors : undefined;
        stopSubmit(error);
        setSubmitFailed.apply(void 0, fields);

        if (onSubmitFail) {
          onSubmitFail(error, dispatch, submitError, props);
        }

        if (error || onSubmitFail) {
          // if you've provided an onSubmitFail callback, don't re-throw the error
          return error;
        } else {
          throw submitError;
        }
      }

      if (isPromise(result)) {
        startSubmit();
        return result.then(function (submitResult) {
          stopSubmit();
          setSubmitSucceeded();

          if (onSubmitSuccess) {
            onSubmitSuccess(submitResult, dispatch, props);
          }

          return submitResult;
        }, function (submitError) {
          var error = isSubmissionError(submitError) ? submitError.errors : undefined;
          stopSubmit(error);
          setSubmitFailed.apply(void 0, fields);

          if (onSubmitFail) {
            onSubmitFail(error, dispatch, submitError, props);
          }

          if (error || onSubmitFail) {
            // if you've provided an onSubmitFail callback, don't re-throw the error
            return error;
          } else {
            throw submitError;
          }
        });
      } else {
        setSubmitSucceeded();

        if (onSubmitSuccess) {
          onSubmitSuccess(result, dispatch, props);
        }
      }

      return result;
    };

    var asyncValidateResult = asyncValidate && asyncValidate();

    if (asyncValidateResult) {
      return asyncValidateResult.then(function (asyncErrors) {
        if (asyncErrors) {
          throw asyncErrors;
        }

        return doSubmit();
      }).catch(function (asyncErrors) {
        setSubmitFailed.apply(void 0, fields);

        if (onSubmitFail) {
          onSubmitFail(asyncErrors, dispatch, null, props);
        }

        return Promise.reject(asyncErrors);
      });
    } else {
      return doSubmit();
    }
  } else {
    setSubmitFailed.apply(void 0, fields);
    var errors = mergeErrors({
      asyncErrors: asyncErrors,
      syncErrors: syncErrors
    });

    if (onSubmitFail) {
      onSubmitFail(errors, dispatch, null, props);
    }

    return errors;
  }
};

export default handleSubmit;