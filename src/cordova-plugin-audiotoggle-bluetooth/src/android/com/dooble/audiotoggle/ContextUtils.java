package com.dooble.audiotoggle;

import android.content.Context;

public class ContextUtils {
  private static Context context;

  public static void setContext(Context ctx){
    context = ctx.getApplicationContext();
  }

  public static Context getApplicationContext(){
    return context;
  }
}
