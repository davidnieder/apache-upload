"use strict";
var env;

var build_url = function(fileInfo)  {
  var url;
  var a = document.createElement('a');
  a.setAttribute('href', '/');
  url = a.href;
  fileInfo['is_private'] === true ? url += 'prv/' : url += 'pup/';
  url += fileInfo['uuid'] + '/';
  url += fileInfo['filename'];
  return url;
};

var widgets = function() {
    var info = (function()  {
      var $container = document.getElementById('info'),
        $header = $container.querySelector('.section-head'),
        $body = $container.querySelector('.section-body');

      return  {
        show: function() {
          $container.style.display = 'block';
        },

        hide: function() {
          $container.style.display = 'none';
        },

        setText: function(infoText)  {
          $body.innerHTML = infoText;
        },

        uploadSuccessful: function(fileUrl)  {
          $body.innerHTML = '' +
            '<div class="row">' +
            'Your file was successfully uploaded! It\'s url is:' +
            '</div>' +
            '<div class="row">' +
            '<input class="urlfield" type="text" value="' + fileUrl + '">' +
            '</div>';
        }
      };
    })();

    var error = (function() {
      var $container = document.getElementById('error'),
        $body = $container.querySelector('.section-body');

      return  {
        show: function() {
          $container.style.display = 'block';
        },

        hide: function() {
          $container.style.display = 'none';
        },

        setText: function(errorText, errorReason)  {
          $body.innerHTML = '<div class="row">' + errorText + '</div>';
          if (errorReason)  {
            $body.innerHTML += '<div class="row small">' + errorReason + '</div>';
          }
        }
      };
    })();

    var progress = (function() {
      var progressSegment = document.getElementById('progress'),
        progressBar = document.getElementById('progress-bar');

      return  {
        show: function() {
          progressBar.innerHTML = '0%';
          progressBar.style.width = '0%';
          progressSegment.style.display = 'block';
        },

        update: function(progressEvent) {
          var progress = Math.floor(progressEvent.loaded/progressEvent.total*100);
          progressBar.innerHTML = progress + '%';
          progressBar.style.width = progress + '%';
        },

        hide: function() {
          progressSegment.style.display = 'none';
        }
      };
    })();

    var fileForm = (function()  {
      var container = document.getElementById('upload'),
        uploadForm = document.getElementById('upload-form'),
        fileInput = document.getElementById('file-input'),
        submitBtn = document.getElementById('submit-button'),
        fileError = document.getElementById('file-input-error');

      var onFileSelected = function(event) {
        if (fileInput.files.length == 1)  {
          if (fileInput.files[0].size > env.fileSizeLimit['bytes'])  {
            fileError.innerHTML = '(selected file is too large)';
            fileError.style.display = 'inline';
          } else  {
            fileError.style.display = 'none';
          }
        }
      };

      var validateForm = function(form) {
        var file = form.get('user-file');
        if (typeof(file) !== 'object' || file.name === undefined ||
            file.size === undefined || file.name === '')  {

          fileError.innerHTML = '(please select a file)';
          fileError.style.display = 'inline';
          return false;
        }
        if (file.size === 0 || file.size > env.fileSizeLimit['bytes']) {
          fileError.innerHTML = '(selected file is too large)';
          fileError.style.display = 'inline';
          return false;
        }
        fileError.style.display = 'none';
        return true;
      };

      var uploadSuccessful = function(fileInfo)  {
        progress.hide();

        fileInfo['url'] = build_url(fileInfo);
        info.uploadSuccessful(fileInfo['url']);
        info.show();
        fileOverview.addRow(fileInfo, false, true);
        uploadForm.reset();
      };

      var uploadFailed = function(xhr, resp) {
        progress.hide();

        console.log('upload failed, resp status: ' + xhr.status +
            ', resp body: ' + xhr.responseText);

        if (resp && resp['reason']) {
          error.setText('Upload failed. Reason:', resp['reason']);
        } else {
          error.setText('Upload failed.', xhr.status + ' ' + xhr.responseText);
        }
        error.show();
      };

      var submitForm = function(event) {
        event.preventDefault();
        var form = new FormData(uploadForm);
        if (!validateForm(form)) return;

        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
          if (xhr.readyState === 1) {
            info.hide();
            error.hide();
            progress.show();
          }
          else if (xhr.readyState === 4) {
            if (xhr.status === 200) {
              var resp = JSON.parse(xhr.responseText);
              if (resp['success'] && resp['fileInfo'])  {
                uploadSuccessful(resp['fileInfo']);
              } else {
                uploadFailed(xhr, resp);
              }
            } else {
              uploadFailed(xhr);
            }
          }
        };
        xhr.upload.onprogress = progress.update;
        xhr.open('POST', env.endpoints['upload']);
        xhr.send(form);
      };

      var init = function() {
        fileInput.addEventListener('change', onFileSelected);
        submitBtn.addEventListener('click', submitForm);
        document.getElementById('file-size-limit').innerText = '(max file size: ' +
            env.fileSizeLimit['humanReadable'] + ')';

        container.style.display = 'block';
      };

      return {
        init: init
      };
    })();

    var fileOverview = (function()  {
      var container = document.getElementById('overview'),
        fileTable = document.getElementById('file-table'),
        tableBody = fileTable.querySelector('tbody'),
        emptyMsg = document.getElementById('empty-table');

      var onDeleteLinkClick = function(event, fileInfo)  {
        event.preventDefault();
        if (!confirm('Do you want to delete the file "' + fileInfo.filename + '"?')) {
          return;
        }

        var xhr = new XMLHttpRequest();
        var endpoint = env.endpoints['delete'] + '?fileid=' + fileInfo.uuid;
        xhr.onreadystatechange = function() {
          if (xhr.readyState === 4) {
            if (xhr.status === 200) {
              var resp = JSON.parse(xhr.responseText);
              if (resp['success']) {
                info.setText('The file "' + fileInfo.filename +
                    '" was removed from the server.');
                info.show();
                var row = tableBody.querySelector('tr[data-row-for="' +
                  fileInfo.uuid + '"]');
                tableBody.removeChild(row);
              } else {
                error.setText('Deleting file failed.', 'unkown error');
                error.show();
              }
            } else {
              error.setText('Deleting file failed.', xhr.status + ' ' + xhr.responseText);
              error.show();
            }
          }
        };
        xhr.open('DELETE', endpoint);
        xhr.send();
      };

      var addRow = function(fileInfo, adminView, prependRow)  {
        var row = document.createElement('tr');
        var cell;

        var fileLink = document.createElement('a');
        fileLink.setAttribute('href', fileInfo['url']);
        fileLink.appendChild(document.createTextNode(fileInfo['filename']));

        var validFor = 'forever';
        if (typeof fileInfo['validfor'] === 'number' && fileInfo['validfor'] > 0) {
          var uploadTime = fileInfo['timestamp']*1000;
          var days = fileInfo['validfor']*24*60*60*1000;
          validFor = (new Date(uploadTime + days)).toLocaleDateString();
        }

        var deleteLink = document.createElement('a');
        deleteLink.setAttribute('href', '#');
        deleteLink.appendChild(document.createTextNode('delete'));
        deleteLink.addEventListener('click', (ev) => {
          onDeleteLinkClick(ev, fileInfo); });

        if (adminView)  {
          cell = document.createElement('td');
          cell.appendChild(fileLink)
          row.appendChild(cell);

          cell = document.createElement('td');
          cell.appendChild(document.createTextNode(fileInfo['username']));
          row.appendChild(cell);

          cell = document.createElement('td');
          cell.appendChild(document.createTextNode(validFor));
          row.appendChild(cell);

        } else {
          cell = document.createElement('td');
          cell.appendChild(fileLink);
          row.appendChild(cell);

          cell = document.createElement('td');
          cell.appendChild(document.createTextNode(validFor));
          row.appendChild(cell);

        }
        cell = document.createElement('td');
        cell.appendChild(deleteLink);
        row.appendChild(cell);

        row.setAttribute('data-row-for', fileInfo['uuid']);

        if (prependRow === true && tableBody.firstChild !== null) {
          tableBody.insertBefore(row, tableBody.firstChild);
        } else {
          tableBody.appendChild(row);
        }

        if (fileTable.style.display === '') {
          emptyMsg.style.display = 'none';
          fileTable.style.display = 'table';
        }
      };

      var init = function(adminView) {
        env.files.forEach(function(fileInfo)  {
          fileInfo['url'] = build_url(fileInfo);
          addRow(fileInfo, adminView, false);
        });
        container.style.display = 'block';
      };

      return {
        init: init,
        addRow: addRow
      };
    })();

    return  {
      info: info,
      error: error,
      progress: progress,
      fileForm: fileForm,
      fileOverview: fileOverview
    };
};

var uploadApp = function(admin) {
  widgets = widgets();
  widgets.info.setText('Loading &hellip;');
  widgets.info.show();

  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      widgets.info.hide();
      if (xhr.status === 200) {
        env = JSON.parse(xhr.responseText);
        if (!admin) {
          widgets.fileForm.init();
        }
        widgets.fileOverview.init(admin);
      } else {
        widgets.error.setText('Could not initialize application', xhr.responseText);
        widgets.error.show();
      }
    }
  };
  if (admin)  {
    xhr.open('GET', '/app/admin');
  } else {
    xhr.open('GET', '/app/jsenv');
  }
  xhr.send();
};
