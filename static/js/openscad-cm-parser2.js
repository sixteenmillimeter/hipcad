
CodeMirror.defineMode("OpenSCAD", function(config, parserConfig) {
  var mustacheOverlay = {
    token: function(stream, state) {
      var ch;
      if (stream.match("<")) {
        while ((ch = stream.next()) != null)
          if (ch == ">") {
            stream.eat(">");
            return "OpenSCAD";
          }
      }
      while (stream.next() != null && !stream.match("<", false)) {}
      return null;
    }
  };
  return CodeMirror.overlayMode(CodeMirror.getMode(config, parserConfig.backdrop || "text/html"), mustacheOverlay);
});


